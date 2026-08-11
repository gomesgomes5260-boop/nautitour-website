import { createAdminClient } from '@/lib/supabase/admin';
import type { DateRange } from '@/lib/date-range';

/**
 * Relatório de vendas de UM vendedor no período (filtro por data de criação
 * da reserva). Compartilhado entre a página e o export .xlsx.
 */

export type SellerSaleRow = {
  bookingCode: string;
  createdAt: string;
  departureAt: string | null;
  tourName: string;
  customerName: string;
  pax: number;
  totalCents: number;
  paidCents: number;
  status: string;
  payoutCents: number | null;
  payoutStatus: string | null;
};

export type SellerReport = {
  rows: SellerSaleRow[];
  totals: {
    bookings: number;
    pax: number;
    totalCents: number;
    paidCents: number;
    commissionSentCents: number;
    commissionPendingCents: number;
  };
};

export async function getSellerReport(
  sellerId: string,
  range: DateRange
): Promise<SellerReport> {
  const admin = createAdminClient();

  const { data: bookings } = await admin
    .from('bookings')
    .select(
      `
      id, booking_code, created_at, passenger_count, total_cents,
      amount_paid_cents, status,
      tour:tours ( name ),
      schedule:tour_schedules ( departure_at ),
      customer:customers ( full_name, email )
      `
    )
    .eq('seller_id', sellerId)
    .gte('created_at', range.fromIso)
    .lt('created_at', range.toIso)
    .order('created_at', { ascending: false })
    .limit(1000);

  type Joined = {
    id: string;
    booking_code: string;
    created_at: string;
    passenger_count: number;
    total_cents: number;
    amount_paid_cents: number | null;
    status: string;
    tour: { name: string } | { name: string }[] | null;
    schedule: { departure_at: string } | { departure_at: string }[] | null;
    customer:
      | { full_name: string | null; email: string }
      | { full_name: string | null; email: string }[]
      | null;
  };
  const list = (bookings ?? []) as unknown as Joined[];

  const bookingIds = list.map((b) => b.id);
  const { data: payouts } = bookingIds.length
    ? await admin
        .from('seller_payouts')
        .select('booking_id, amount_cents, status')
        .in('booking_id', bookingIds)
    : { data: [] as Array<{ booking_id: string; amount_cents: number; status: string }> };
  const payoutFor = new Map(
    (payouts ?? []).map((p) => [p.booking_id, { cents: p.amount_cents, status: p.status }])
  );

  const rows: SellerSaleRow[] = list.map((b) => {
    const tour = Array.isArray(b.tour) ? b.tour[0] : b.tour;
    const sched = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
    const cust = Array.isArray(b.customer) ? b.customer[0] : b.customer;
    const payout = payoutFor.get(b.id) ?? null;
    return {
      bookingCode: b.booking_code,
      createdAt: b.created_at,
      departureAt: sched?.departure_at ?? null,
      tourName: tour?.name ?? '—',
      customerName:
        cust?.full_name ??
        (cust?.email && !cust.email.endsWith('.invalid') ? cust.email : '—'),
      pax: b.passenger_count,
      totalCents: b.total_cents,
      paidCents: b.amount_paid_cents ?? 0,
      status: b.status,
      payoutCents: payout?.cents ?? null,
      payoutStatus: payout?.status ?? null,
    };
  });

  // Somatórios: reservas canceladas ficam fora dos totais financeiros.
  const active = rows.filter((r) => r.status !== 'cancelled');
  const totals = {
    bookings: active.length,
    pax: active.reduce((a, r) => a + r.pax, 0),
    totalCents: active.reduce((a, r) => a + r.totalCents, 0),
    paidCents: active.reduce((a, r) => a + r.paidCents, 0),
    commissionSentCents: rows
      .filter((r) => r.payoutStatus === 'sent')
      .reduce((a, r) => a + (r.payoutCents ?? 0), 0),
    commissionPendingCents: rows
      .filter((r) => r.payoutStatus === 'pending' || r.payoutStatus === 'failed')
      .reduce((a, r) => a + (r.payoutCents ?? 0), 0),
  };

  return { rows, totals };
}
