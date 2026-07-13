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
  const { buildWaUrl } = await import('@/lib/whatsapp');
  const { sendEmail } = await import('@/lib/email');

  const { subject, html, text } = renderBookingCancelled({
    bookingCode: b.booking_code,
    customerName: customer.full_name ?? '',
    tourName: tour?.name ?? 'Passeio Nautitour',
    departureAt: schedule?.departure_at ?? null,
    hadPaidPayment: (b.payments ?? []).some((p) => p.status === 'paid'),
    siteUrl,
    waUrl: buildWaUrl(
      `Olá! Cancelei a reserva ${b.booking_code} pelo site e tenho uma dúvida.`
    ),
  });
  await sendEmail({ to: customer.email, subject, html, text });
}
