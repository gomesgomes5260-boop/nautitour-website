import { createAdminClient } from '@/lib/supabase/admin';
import { brtDayOf, rangeDays, shortDay, type DateRange } from '@/lib/date-range';

/**
 * Agregação do dashboard pro período filtrado — compartilhada entre a página
 * e o export .xlsx pra não divergirem. Tour de teste excluído de tudo.
 */

export type DailyPoint = { day: string; label: string; value: number };

export type OverviewData = {
  days: string[];
  revenueCents: number;
  revenueByDay: DailyPoint[];
  paxTotal: number;
  paxByDay: DailyPoint[];
  occPct: number;
  occByDay: DailyPoint[];
  refundsCount: number;
  refundsTotalCents: number;
  refundsByDay: DailyPoint[];
  chatsCount: number;
  chatsByDay: DailyPoint[];
};

function emptySeries(days: string[]): Map<string, number> {
  return new Map(days.map((d) => [d, 0]));
}

function toPoints(days: string[], m: Map<string, number>): DailyPoint[] {
  return days.map((d) => ({ day: d, label: shortDay(d), value: m.get(d) ?? 0 }));
}

export async function getOverviewData(range: DateRange): Promise<OverviewData> {
  const admin = createAdminClient();
  const days = rangeDays(range);

  const { data: testTours } = await admin.from('tours').select('id').eq('is_test_only', true);
  const testTourIds = new Set((testTours ?? []).map((t) => t.id));

  // ===== Receita (payments pagos no período) =====
  const { data: payments } = await admin
    .from('payments')
    .select('amount_cents, paid_at, booking_id')
    .eq('status', 'paid')
    .gte('paid_at', range.fromIso)
    .lt('paid_at', range.toIso);
  const payBookingIds = (payments ?? []).map((p) => p.booking_id);
  const { data: payBookings } = payBookingIds.length
    ? await admin.from('bookings').select('id, tour_id').in('id', payBookingIds)
    : { data: [] as Array<{ id: string; tour_id: string }> };
  const tourOf = new Map((payBookings ?? []).map((b) => [b.id, b.tour_id]));

  let revenueCents = 0;
  const revenueMap = emptySeries(days);
  for (const p of payments ?? []) {
    const tourId = tourOf.get(p.booking_id);
    if (!p.paid_at || (tourId && testTourIds.has(tourId))) continue;
    revenueCents += p.amount_cents ?? 0;
    const day = brtDayOf(p.paid_at);
    if (revenueMap.has(day)) revenueMap.set(day, (revenueMap.get(day) ?? 0) + (p.amount_cents ?? 0));
  }

  // ===== Embarques + ocupação (saídas do período) =====
  const { data: schedules } = await admin
    .from('tour_schedules')
    .select('departure_at, capacity, seats_taken, status, tour_id')
    .gte('departure_at', range.fromIso)
    .lt('departure_at', range.toIso);
  const validSchedules = (schedules ?? []).filter(
    (s) => s.status !== 'cancelled' && !testTourIds.has(s.tour_id)
  );

  let paxTotal = 0;
  const paxMap = emptySeries(days);
  const occSum = emptySeries(days);
  const occCount = emptySeries(days);
  for (const s of validSchedules) {
    const day = brtDayOf(s.departure_at);
    paxTotal += s.seats_taken;
    if (paxMap.has(day)) {
      paxMap.set(day, (paxMap.get(day) ?? 0) + s.seats_taken);
      if (s.capacity > 0) {
        occSum.set(day, (occSum.get(day) ?? 0) + s.seats_taken / s.capacity);
        occCount.set(day, (occCount.get(day) ?? 0) + 1);
      }
    }
  }
  const occMap = emptySeries(days);
  for (const d of days) {
    const c = occCount.get(d) ?? 0;
    occMap.set(d, c > 0 ? Math.round(((occSum.get(d) ?? 0) / c) * 100) : 0);
  }
  const withCapacity = validSchedules.filter((s) => s.capacity > 0);
  const occPct =
    withCapacity.length === 0
      ? 0
      : Math.round(
          (withCapacity.reduce((acc, s) => acc + s.seats_taken / s.capacity, 0) /
            withCapacity.length) *
            100
        );

  // ===== Reembolsos (eventos no período) =====
  const { data: refundEvents } = await admin
    .from('booking_events')
    .select('booking_id, created_at')
    .eq('kind', 'refund_succeeded')
    .gte('created_at', range.fromIso)
    .lt('created_at', range.toIso);
  const refundsCount = (refundEvents ?? []).length;
  const refundsMap = emptySeries(days);
  for (const e of refundEvents ?? []) {
    const day = brtDayOf(e.created_at);
    if (refundsMap.has(day)) refundsMap.set(day, (refundsMap.get(day) ?? 0) + 1);
  }
  const refundBookingIds = (refundEvents ?? []).map((e) => e.booking_id);
  const { data: refundPayments } = refundBookingIds.length
    ? await admin
        .from('payments')
        .select('amount_cents')
        .in('booking_id', refundBookingIds)
        .eq('status', 'refunded')
    : { data: [] as Array<{ amount_cents: number }> };
  const refundsTotalCents = (refundPayments ?? []).reduce(
    (acc, p) => acc + (p.amount_cents ?? 0),
    0
  );

  // ===== Chats WhatsApp =====
  const { data: clicks } = await admin
    .from('whatsapp_clicks')
    .select('clicked_at')
    .gte('clicked_at', range.fromIso)
    .lt('clicked_at', range.toIso);
  const chatsCount = (clicks ?? []).length;
  const chatsMap = emptySeries(days);
  for (const c of clicks ?? []) {
    const day = brtDayOf(c.clicked_at);
    if (chatsMap.has(day)) chatsMap.set(day, (chatsMap.get(day) ?? 0) + 1);
  }

  return {
    days,
    revenueCents,
    revenueByDay: toPoints(days, revenueMap),
    paxTotal,
    paxByDay: toPoints(days, paxMap),
    occPct,
    occByDay: toPoints(days, occMap),
    refundsCount,
    refundsTotalCents,
    refundsByDay: toPoints(days, refundsMap),
    chatsCount,
    chatsByDay: toPoints(days, chatsMap),
  };
}
