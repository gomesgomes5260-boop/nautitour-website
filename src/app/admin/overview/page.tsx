import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const DATETIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const TIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
});

const PRICE = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const COMPACT_PRICE = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const EVENT_LABEL: Record<string, string> = {
  created: 'Reserva criada',
  payment_paid: 'Pagamento aprovado',
  payment_failed: 'Pagamento recusado',
  admin_cancelled: 'Cancelada pelo admin',
  customer_cancelled: 'Cancelada pelo cliente',
  schedule_blocked: 'Saída bloqueada',
  refund_succeeded: 'Reembolso aprovado',
  refund_failed: 'Reembolso recusado',
  email_resent: 'E-mail reenviado',
  converted_from_inquiry: 'Convertida de inquiry',
};

// Eventos que aparecem no feed (poda eventos secundários como email_resent).
const VISIBLE_EVENT_KINDS = [
  'created',
  'payment_paid',
  'payment_failed',
  'admin_cancelled',
  'customer_cancelled',
  'refund_succeeded',
  'refund_failed',
  'converted_from_inquiry',
  'schedule_blocked',
];

function brtTodayISO(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function monthBoundsBRT(): { fromIso: string; toIso: string } {
  const today = brtTodayISO(); // YYYY-MM-DD
  const [y, m] = today.split('-').map(Number);
  const fromIso = new Date(`${y}-${String(m).padStart(2, '0')}-01T00:00:00-03:00`).toISOString();
  const next = new Date(`${y}-${String(m).padStart(2, '0')}-01T00:00:00-03:00`);
  next.setMonth(next.getMonth() + 1);
  return { fromIso, toIso: next.toISOString() };
}

function dayBoundsBRT(daysOffset = 0): { fromIso: string; toIso: string } {
  const today = brtTodayISO();
  const d = new Date(`${today}T00:00:00-03:00`);
  d.setDate(d.getDate() + daysOffset);
  const fromIso = d.toISOString();
  const next = new Date(d);
  next.setDate(next.getDate() + 1);
  return { fromIso, toIso: next.toISOString() };
}

export default async function AdminOverviewPage() {
  const admin = createAdminClient();
  const { fromIso: monthFrom, toIso: monthTo } = monthBoundsBRT();
  const { fromIso: todayFrom, toIso: todayTo } = dayBoundsBRT(0);

  // Excluir tour-de-teste das métricas financeiras
  const { data: testTours } = await admin.from('tours').select('id').eq('is_test_only', true);
  const testTourIds = (testTours ?? []).map((t) => t.id);

  // ---------- KPIs ----------
  // 1) Receita do mês (caixa = payments.status='paid')
  const monthPaymentsQuery = admin
    .from('payments')
    .select('amount_cents, booking_id, status, paid_at')
    .eq('status', 'paid')
    .gte('paid_at', monthFrom)
    .lt('paid_at', monthTo);
  const { data: monthPaymentsRaw } = await monthPaymentsQuery;
  // Filtra tour-de-teste via lookup de bookings → tour_id
  const monthBookingIds = (monthPaymentsRaw ?? []).map((p) => p.booking_id);
  const { data: monthBookings } = monthBookingIds.length
    ? await admin.from('bookings').select('id, tour_id').in('id', monthBookingIds)
    : { data: [] as Array<{ id: string; tour_id: string }> };
  const monthBookingTour = new Map((monthBookings ?? []).map((b) => [b.id, b.tour_id]));
  const monthRevenueCents = (monthPaymentsRaw ?? []).reduce((acc, p) => {
    const tourId = monthBookingTour.get(p.booking_id);
    if (tourId && testTourIds.includes(tourId)) return acc;
    return acc + (p.amount_cents ?? 0);
  }, 0);

  // 2) Reservas hoje (confirmadas) — schedules com departure_at no dia BRT atual
  const { data: schedulesToday } = await admin
    .from('tour_schedules')
    .select('id, departure_at, capacity, seats_taken, status, tour:tours(name, is_test_only)')
    .gte('departure_at', todayFrom)
    .lt('departure_at', todayTo)
    .order('departure_at', { ascending: true });
  type SchedToday = {
    id: string;
    departure_at: string;
    capacity: number;
    seats_taken: number;
    status: string;
    tour: { name: string; is_test_only: boolean } | { name: string; is_test_only: boolean }[] | null;
  };
  const todayList = ((schedulesToday ?? []) as unknown as SchedToday[]).filter((s) => {
    const t = Array.isArray(s.tour) ? s.tour[0] : s.tour;
    return t && !t.is_test_only;
  });
  const todayBookingsCount = todayList.reduce((acc, s) => acc + s.seats_taken, 0);

  // 3) Ocupação média 7 dias (schedules concluídos ou em curso) — exclui canceladas e teste
  const { fromIso: sevenAgoFrom } = dayBoundsBRT(-7);
  const { toIso: nowToISO } = dayBoundsBRT(0);
  const { data: schedules7d } = await admin
    .from('tour_schedules')
    .select('capacity, seats_taken, status, tour_id')
    .gte('departure_at', sevenAgoFrom)
    .lt('departure_at', nowToISO);
  const valid7d = (schedules7d ?? []).filter(
    (s) => s.status !== 'cancelled' && s.capacity > 0 && !testTourIds.includes(s.tour_id)
  );
  const occupancy7d =
    valid7d.length === 0
      ? 0
      : Math.round(
          (valid7d.reduce((acc, s) => acc + s.seats_taken / s.capacity, 0) / valid7d.length) * 100
        );

  // 4) Reembolsos do mês (count + soma) via booking_events
  const { data: refundEvents } = await admin
    .from('booking_events')
    .select('booking_id, created_at, payload')
    .eq('kind', 'refund_succeeded')
    .gte('created_at', monthFrom)
    .lt('created_at', monthTo);
  const refundsCount = (refundEvents ?? []).length;
  // Soma os valores via lookup nas amount_cents (refund total = payment.amount_cents)
  const refundBookingIds = (refundEvents ?? []).map((e) => e.booking_id);
  const { data: refundPayments } = refundBookingIds.length
    ? await admin
        .from('payments')
        .select('amount_cents, booking_id')
        .in('booking_id', refundBookingIds)
        .eq('status', 'refunded')
    : { data: [] as Array<{ amount_cents: number; booking_id: string }> };
  const refundsTotalCents = (refundPayments ?? []).reduce((acc, p) => acc + (p.amount_cents ?? 0), 0);

  // ---------- Receita 14 dias (bar chart) ----------
  const { fromIso: fourteenAgoFrom } = dayBoundsBRT(-13);
  const { data: paymentsLast14 } = await admin
    .from('payments')
    .select('amount_cents, paid_at, booking_id')
    .eq('status', 'paid')
    .gte('paid_at', fourteenAgoFrom)
    .lt('paid_at', nowToISO);
  const last14BookingIds = (paymentsLast14 ?? []).map((p) => p.booking_id);
  const { data: last14Bookings } = last14BookingIds.length
    ? await admin.from('bookings').select('id, tour_id').in('id', last14BookingIds)
    : { data: [] as Array<{ id: string; tour_id: string }> };
  const last14Tour = new Map((last14Bookings ?? []).map((b) => [b.id, b.tour_id]));

  const dayBuckets: Array<{ label: string; cents: number; isToday: boolean }> = [];
  for (let i = -13; i <= 0; i++) {
    const d = new Date(`${brtTodayISO()}T12:00:00-03:00`);
    d.setDate(d.getDate() + i);
    const dayKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
    dayBuckets.push({
      label: `${dayKey.slice(8)}/${dayKey.slice(5, 7)}`,
      cents: 0,
      isToday: i === 0,
    });
  }
  for (const p of paymentsLast14 ?? []) {
    if (!p.paid_at) continue;
    const tourId = last14Tour.get(p.booking_id);
    if (tourId && testTourIds.includes(tourId)) continue;
    const dayKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(p.paid_at));
    const idx = dayBuckets.findIndex((b) => b.label === `${dayKey.slice(8)}/${dayKey.slice(5, 7)}`);
    if (idx >= 0) dayBuckets[idx].cents += p.amount_cents ?? 0;
  }
  const max14 = Math.max(...dayBuckets.map((b) => b.cents), 1);
  const sum14 = dayBuckets.reduce((a, b) => a + b.cents, 0);

  // ---------- Atividade recente ----------
  const { data: recentEvents } = await admin
    .from('booking_events')
    .select('id, kind, payload, created_at, booking_id')
    .in('kind', VISIBLE_EVENT_KINDS)
    .order('created_at', { ascending: false })
    .limit(10);
  const recentBookingIds = (recentEvents ?? []).map((e) => e.booking_id);
  const { data: recentBookings } = recentBookingIds.length
    ? await admin.from('bookings').select('id, booking_code').in('id', recentBookingIds)
    : { data: [] as Array<{ id: string; booking_code: string }> };
  const recentCodeFor = new Map((recentBookings ?? []).map((b) => [b.id, b.booking_code]));

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Visão geral</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi label="Receita do mês" value={PRICE.format(monthRevenueCents / 100)} />
        <Kpi
          label="Embarques hoje"
          value={String(todayBookingsCount)}
          sub={`${todayList.length} saída${todayList.length === 1 ? '' : 's'}`}
        />
        <Kpi label="Ocupação 7d" value={`${occupancy7d}%`} />
        <Kpi
          label="Reembolsos do mês"
          value={String(refundsCount)}
          sub={refundsTotalCents > 0 ? PRICE.format(refundsTotalCents / 100) : '—'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Saídas de hoje */}
        <section className="bg-white border border-gray-200 rounded-md p-6">
          <h2 className="text-lg font-semibold mb-4">Saídas de hoje</h2>
          {todayList.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma saída programada hoje.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {todayList.map((s) => {
                const tour = Array.isArray(s.tour) ? s.tour[0] : s.tour;
                const pct = s.capacity > 0 ? Math.round((s.seats_taken / s.capacity) * 100) : 0;
                const cls =
                  s.status === 'cancelled'
                    ? 'bg-gray-200 text-gray-600'
                    : pct >= 95
                    ? 'bg-red-100 text-red-800'
                    : pct >= 70
                    ? 'bg-amber-100 text-amber-800'
                    : pct > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-gray-100 text-gray-700';
                return (
                  <li key={s.id} className="flex items-center gap-3 py-2">
                    <span className="font-mono text-sm w-12">
                      {TIME.format(new Date(s.departure_at))}
                    </span>
                    <Link
                      href={`/admin/manifesto/${s.id}`}
                      className="flex-1 text-sm hover:underline"
                    >
                      {tour?.name ?? '—'}
                    </Link>
                    <span className={`text-xs px-2 py-0.5 rounded ${cls}`}>
                      {s.seats_taken}/{s.capacity} · {pct}%
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Receita 14 dias */}
        <section className="bg-white border border-gray-200 rounded-md p-6">
          <h2 className="text-lg font-semibold mb-1">Receita · últimos 14 dias</h2>
          <p className="text-xs text-gray-500 mb-4">
            Total: {PRICE.format(sum14 / 100)}
          </p>
          <svg viewBox="0 0 280 140" className="w-full h-36">
            {dayBuckets.map((b, idx) => {
              const x = idx * (280 / 14);
              const h = (b.cents / max14) * 110;
              const y = 120 - h;
              const fill = b.isToday
                ? '#D90006'
                : idx % 7 === 6 || idx % 7 === 0
                ? '#404040'
                : '#cccccc';
              return (
                <g key={idx}>
                  <rect
                    x={x + 2}
                    y={y}
                    width={280 / 14 - 4}
                    height={Math.max(h, 1)}
                    fill={fill}
                    rx={2}
                  >
                    <title>
                      {b.label}: {COMPACT_PRICE.format(b.cents / 100)}
                    </title>
                  </rect>
                </g>
              );
            })}
            {dayBuckets.map((b, idx) => (
              <text
                key={`l-${idx}`}
                x={idx * (280 / 14) + (280 / 14) / 2}
                y={134}
                textAnchor="middle"
                fontSize="6"
                fill="#666"
              >
                {b.label.slice(0, 2)}
              </text>
            ))}
          </svg>
        </section>
      </div>

      {/* Atividade recente */}
      <section className="bg-white border border-gray-200 rounded-md p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-semibold">Atividade recente</h2>
          <Link href="/admin/reservas" className="text-xs text-[rgb(9,110,171)] hover:underline">
            Ver todas as reservas →
          </Link>
        </div>
        {recentEvents && recentEvents.length > 0 ? (
          <ol className="space-y-3 text-sm">
            {recentEvents.map((e) => {
              const code = recentCodeFor.get(e.booking_id);
              return (
                <li key={e.id} className="flex items-baseline justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{EVENT_LABEL[e.kind] ?? e.kind}</span>
                    {code && (
                      <Link
                        href={`/admin/reservas/${code}`}
                        className="ml-2 font-mono text-xs text-[rgb(9,110,171)] hover:underline"
                      >
                        {code}
                      </Link>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {DATETIME.format(new Date(e.created_at))}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-gray-500">Tudo quieto por aqui.</p>
        )}
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}
