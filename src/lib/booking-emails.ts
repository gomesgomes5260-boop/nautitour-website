import type { createAdminClient } from '@/lib/supabase/admin';

/**
 * E-mails transacionais de cancelamento/estorno pro CLIENTE, compartilhados
 * entre o fluxo do próprio cliente (reserva/[code]/actions) e o do admin
 * (admin/reservas/[code]/actions). Todos best-effort: quem chama embrulha em
 * .catch() — falha de e-mail nunca desfaz a ação.
 */

type Admin = ReturnType<typeof createAdminClient>;

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://nautitour-website.vercel.app';
}

/** Confirmação de cancelamento da reserva (cliente ou admin cancelou). */
export async function sendBookingCancelledEmail(
  admin: Admin,
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
    customer:
      | { email: string; full_name: string | null }
      | { email: string; full_name: string | null }[]
      | null;
    payments: { status: string }[] | null;
  };
  const b = data as unknown as Row;
  const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
  if (!customer?.email || customer.email.endsWith('.invalid')) return;

  const tour = Array.isArray(b.tour) ? b.tour[0] : b.tour;
  const schedule = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
  const site = siteUrl();

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
    siteUrl: site,
    // Passa pela rota interna: conta o clique no KPI e redireciona pro wa.me.
    waUrl: `${site}/api/wa?s=email-cancel&code=${encodeURIComponent(b.booking_code)}`,
  });
  await sendEmail({ to: customer.email, subject, html, text });
}

/** Aviso de estorno processado (total ou parcial) pelo admin. */
export async function sendBookingRefundedEmail(
  admin: Admin,
  bookingId: string,
  refund: {
    amountRefundedCents: number;
    totalPaidCents: number;
    paymentMethod: string | null;
  }
): Promise<void> {
  const { data } = await admin
    .from('bookings')
    .select(
      `
      booking_code,
      tour:tours ( name ),
      customer:customers ( email, full_name )
      `
    )
    .eq('id', bookingId)
    .maybeSingle();
  if (!data) return;

  type Row = {
    booking_code: string;
    tour: { name: string } | { name: string }[] | null;
    customer:
      | { email: string; full_name: string | null }
      | { email: string; full_name: string | null }[]
      | null;
  };
  const b = data as unknown as Row;
  const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
  if (!customer?.email || customer.email.endsWith('.invalid')) return;

  const tour = Array.isArray(b.tour) ? b.tour[0] : b.tour;
  const site = siteUrl();

  const { renderBookingRefunded } = await import(
    '@/lib/email-templates/booking-refunded'
  );
  const { sendEmail } = await import('@/lib/email');

  const { subject, html, text } = renderBookingRefunded({
    bookingCode: b.booking_code,
    customerName: customer.full_name ?? '',
    tourName: tour?.name ?? 'Passeio Nautitour',
    amountRefundedCents: refund.amountRefundedCents,
    totalPaidCents: refund.totalPaidCents,
    paymentMethod: refund.paymentMethod,
    siteUrl: site,
    waUrl: `${site}/api/wa?s=email-cancel&code=${encodeURIComponent(b.booking_code)}`,
  });
  await sendEmail({ to: customer.email, subject, html, text });
}
