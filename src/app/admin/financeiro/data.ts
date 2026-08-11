import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Agregação do Financeiro pra um intervalo [fromIso, toIso) — compartilhada
 * entre a página e o export .xlsx. Tour de teste excluído de tudo.
 */

export type FinanceTransaction = {
  paidAt: string | null;
  bookingCode: string | null;
  customerName: string;
  tourName: string;
  method: string;
  amountCents: number;
};

export type FinanceData = {
  revenueCents: number;
  pendingTotalCents: number;
  pendingCount: number;
  refundsTotalCents: number;
  refundsCount: number;
  cancelledCount: number;
  methodRows: Array<{ method: string; cents: number; pct: number }>;
  tourRows: Array<{ tourId: string; name: string; cents: number; pct: number }>;
  transactions: FinanceTransaction[];
};

export async function getFinanceData(fromIso: string, toIso: string): Promise<FinanceData> {
  const admin = createAdminClient();

  const { data: tours } = await admin
    .from('tours')
    .select('id, name, slug, is_test_only')
    .order('name');
  const toursById = new Map((tours ?? []).map((t) => [t.id, t]));
  const testTourIds = (tours ?? []).filter((t) => t.is_test_only).map((t) => t.id);

  const { data: paymentsRaw } = await admin
    .from('payments')
    .select('id, amount_cents, payment_method, paid_at, booking_id, status, created_at')
    .eq('status', 'paid')
    .gte('paid_at', fromIso)
    .lt('paid_at', toIso)
    .order('paid_at', { ascending: false });

  const bookingIds = (paymentsRaw ?? []).map((p) => p.booking_id);
  const { data: bookingsRaw } = bookingIds.length
    ? await admin
        .from('bookings')
        .select('id, booking_code, tour_id, customer_id')
        .in('id', bookingIds)
    : { data: [] as Array<{ id: string; booking_code: string; tour_id: string; customer_id: string }> };
  const bookingById = new Map((bookingsRaw ?? []).map((b) => [b.id, b]));

  const customerIds = (bookingsRaw ?? []).map((b) => b.customer_id);
  const { data: customersRaw } = customerIds.length
    ? await admin.from('customers').select('id, full_name, email').in('id', customerIds)
    : { data: [] as Array<{ id: string; full_name: string | null; email: string }> };
  const customerById = new Map((customersRaw ?? []).map((c) => [c.id, c]));

  const validPayments = (paymentsRaw ?? []).filter((p) => {
    const b = bookingById.get(p.booking_id);
    return b && !testTourIds.includes(b.tour_id);
  });

  const revenueCents = validPayments.reduce((acc, p) => acc + (p.amount_cents ?? 0), 0);

  const { data: pendingRaw } = await admin
    .from('bookings')
    .select('total_cents, tour_id, expires_at')
    .eq('status', 'pending_payment');
  const pendingValid = (pendingRaw ?? []).filter(
    (b) =>
      !testTourIds.includes(b.tour_id) &&
      (!b.expires_at || new Date(b.expires_at) >= new Date())
  );
  const pendingTotalCents = pendingValid.reduce((acc, b) => acc + (b.total_cents ?? 0), 0);
  const pendingCount = pendingValid.length;

  const { data: refundEvents } = await admin
    .from('booking_events')
    .select('booking_id, created_at')
    .eq('kind', 'refund_succeeded')
    .gte('created_at', fromIso)
    .lt('created_at', toIso);
  const refundBookingIds = (refundEvents ?? []).map((e) => e.booking_id);
  const { data: refundPaymentsRaw } = refundBookingIds.length
    ? await admin
        .from('payments')
        .select('amount_cents, booking_id')
        .in('booking_id', refundBookingIds)
        .eq('status', 'refunded')
    : { data: [] as Array<{ amount_cents: number; booking_id: string }> };
  const refundsTotalCents = (refundPaymentsRaw ?? []).reduce((acc, p) => {
    const b = bookingById.get(p.booking_id);
    if (b && testTourIds.includes(b.tour_id)) return acc;
    return acc + (p.amount_cents ?? 0);
  }, 0);
  const refundsCount = (refundEvents ?? []).length;

  const { data: cancelEvents } = await admin
    .from('booking_events')
    .select('booking_id')
    .in('kind', ['admin_cancelled', 'customer_cancelled'])
    .gte('created_at', fromIso)
    .lt('created_at', toIso);
  const cancelledCount = (cancelEvents ?? []).length;

  const methodAgg = new Map<string, number>();
  for (const p of validPayments) {
    methodAgg.set(p.payment_method, (methodAgg.get(p.payment_method) ?? 0) + p.amount_cents);
  }
  const methodRows = Array.from(methodAgg.entries())
    .map(([method, cents]) => ({
      method,
      cents,
      pct: revenueCents > 0 ? cents / revenueCents : 0,
    }))
    .sort((a, b) => b.cents - a.cents);

  const tourAgg = new Map<string, number>();
  for (const p of validPayments) {
    const b = bookingById.get(p.booking_id);
    if (!b) continue;
    tourAgg.set(b.tour_id, (tourAgg.get(b.tour_id) ?? 0) + p.amount_cents);
  }
  const tourRows = Array.from(tourAgg.entries())
    .map(([tourId, cents]) => ({
      tourId,
      name: toursById.get(tourId)?.name ?? '—',
      cents,
      pct: revenueCents > 0 ? cents / revenueCents : 0,
    }))
    .sort((a, b) => b.cents - a.cents);

  const transactions: FinanceTransaction[] = validPayments.map((p) => {
    const b = bookingById.get(p.booking_id);
    const c = b ? customerById.get(b.customer_id) : null;
    const tour = b ? toursById.get(b.tour_id) : null;
    return {
      paidAt: p.paid_at,
      bookingCode: b?.booking_code ?? null,
      customerName: c?.full_name ?? c?.email ?? '—',
      tourName: tour?.name ?? '—',
      method: p.payment_method,
      amountCents: p.amount_cents,
    };
  });

  return {
    revenueCents,
    pendingTotalCents,
    pendingCount,
    refundsTotalCents,
    refundsCount,
    cancelledCount,
    methodRows,
    tourRows,
    transactions,
  };
}
