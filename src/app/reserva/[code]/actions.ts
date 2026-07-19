'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function cancelOwnBookingAction(
  bookingCode: string,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!bookingCode) return { ok: false, error: 'Reserva inválida' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/reserva/${encodeURIComponent(bookingCode)}`);
  }

  // Buscar booking_id (RPC opera por id, UI opera por code)
  const admin = createAdminClient();
  const { data: booking, error: fetchErr } = await admin
    .from('bookings')
    .select('id')
    .eq('booking_code', bookingCode)
    .maybeSingle();
  if (fetchErr) {
    console.error('[cancelOwnBookingAction] fetch', fetchErr);
    return { ok: false, error: 'Falha ao carregar reserva' };
  }
  if (!booking) return { ok: false, error: 'Reserva não encontrada' };

  // RPC roda como usuário autenticado pra `auth.uid()` funcionar e a
  // própria função fazer a checagem de ownership e janela de 48h.
  const { error } = await supabase.rpc('customer_cancel_booking', {
    p_booking_id: booking.id,
    p_reason: reason.trim(),
  });
  if (error) {
    console.error('[cancelOwnBookingAction] rpc', error);
    // Mensagens da RPC já são adequadas pra mostrar (forbidden, window
    // closed, etc.). Não vazamos detalhes de constraint.
    return { ok: false, error: error.message };
  }

  // Confirmação por e-mail — best-effort, nunca desfaz o cancelamento.
  await sendCancellationEmail(admin, booking.id).catch((e) =>
    console.error('[cancelOwnBookingAction] email', e)
  );

  // Aviso interno (reservas@) — a equipe precisa saber que o cliente
  // cancelou pra ajustar a recepção. Best-effort.
  await notifyTeamOfCancellation(admin, booking.id).catch((e) =>
    console.error('[cancelOwnBookingAction] team notify', e)
  );

  revalidatePath('/minhas-reservas');
  revalidatePath(`/reserva/${bookingCode}`);
  return { ok: true };
}

async function sendCancellationEmail(
  admin: ReturnType<typeof createAdminClient>,
  bookingId: string
): Promise<void> {
  const { data } = await admin
    .from('bookings')
    .select(
      `
      booking_code,
      tour:tours ( name ),
      schedule:tour_schedules ( departure_at ),
      customer:customers ( email, full_name ),
      payments:payments ( status )
      `
    )
    .eq('id', bookingId)
    .maybeSingle();
  if (!data) return;

  type Row = {
    booking_code: string;
    tour: { name: string } | { name: string }[] | null;
    schedule: { departure_at: string } | { departure_at: string }[] | null;
    customer: { email: string; full_name: string | null } | { email: string; full_name: string | null }[] | null;
    payments: { status: string }[] | null;
  };
  const b = data as unknown as Row;
  const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
  if (!customer?.email || customer.email.endsWith('.invalid')) return;

  const tour = Array.isArray(b.tour) ? b.tour[0] : b.tour;
  const schedule = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://nautitour-website.vercel.app';

  const { renderBookingCancelled } = await import(
    '@/lib/email-templates/booking-cancelled'
  );
  const { sendEmail } = await import('@/lib/email');

  const { subject, html, text } = renderBookingCancelled({
    bookingCode: b.booking_code,
    customerName: customer.full_name ?? '',
    tourName: tour?.name ?? 'Passeio Nautitour',
    departureAt: schedule?.departure_at ?? null,
    hadPaidPayment: (b.payments ?? []).some((p) => p.status === 'paid'),
    siteUrl,
    // Passa pela rota interna: conta o clique no KPI e redireciona pro wa.me.
    waUrl: `${siteUrl}/api/wa?s=email-cancel&code=${encodeURIComponent(b.booking_code)}`,
  });
  await sendEmail({ to: customer.email, subject, html, text });
}

async function notifyTeamOfCancellation(
  admin: ReturnType<typeof createAdminClient>,
  bookingId: string
): Promise<void> {
  const { data } = await admin
    .from('bookings')
    .select(
      `
      booking_code,
      passenger_count,
      total_cents,
      tour:tours ( name ),
      schedule:tour_schedules ( departure_at ),
      customer:customers ( email, full_name, phone ),
      payments:payments ( status )
      `
    )
    .eq('id', bookingId)
    .maybeSingle();
  if (!data) return;

  type Row = {
    booking_code: string;
    passenger_count: number;
    total_cents: number;
    tour: { name: string } | { name: string }[] | null;
    schedule: { departure_at: string } | { departure_at: string }[] | null;
    customer:
      | { email: string; full_name: string | null; phone: string | null }
      | { email: string; full_name: string | null; phone: string | null }[]
      | null;
    payments: { status: string }[] | null;
  };
  const b = data as unknown as Row;
  const tour = Array.isArray(b.tour) ? b.tour[0] : b.tour;
  const schedule = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
  const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
  const hadPaid = (b.payments ?? []).some((p) => p.status === 'paid');
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://nautitour-website.vercel.app';

  const { notifyTeam, formatBrtDateTime, formatPriceCents } = await import(
    '@/lib/team-notify'
  );
  await notifyTeam(
    `Cliente cancelou a reserva — ${b.booking_code}`,
    [
      ['Código', b.booking_code],
      ['Passeio', tour?.name ?? '—'],
      ['Saída', formatBrtDateTime(schedule?.departure_at ?? null)],
      ['Passageiros', String(b.passenger_count)],
      ['Valor', formatPriceCents(b.total_cents)],
      ['Reembolso', hadPaid ? 'Sim — havia pagamento aprovado' : 'Não havia pagamento'],
      ['Cliente', customer?.full_name],
      ['E-mail', customer?.email?.endsWith('.invalid') ? null : customer?.email],
      ['Telefone', customer?.phone],
    ],
    `${siteUrl.replace(/\/$/, '')}/admin/reservas/${encodeURIComponent(b.booking_code)}`
  );
}
