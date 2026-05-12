import Link from 'next/link';
import {
  DollarSign,
  Users,
  Activity,
  RotateCcw,
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  PlusCircle,
  RefreshCcw,
  Ban,
} from 'lucide-react';
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

const EVENT_ICON: Record<string, { Icon: typeof CheckCircle2; tone: string }> = {
  created: { Icon: PlusCircle, tone: 'bg-[var(--color-charcoal-100)] text-[var(--color-charcoal-700)]' },
  payment_paid: { Icon: CheckCircle2, tone: 'bg-emerald-100 text-emerald-700' },
  payment_failed: { Icon: XCircle, tone: 'bg-[var(--color-red-50)] text-[var(--color-red-600)]' },
  admin_cancelled: { Icon: Ban, tone: 'bg-[var(--color-red-50)] text-[var(--color-red-600)]' },
  customer_cancelled: { Icon: Ban, tone: 'bg-[var(--color-red-50)] text-[var(--color-red-600)]' },
  refund_succeeded: { Icon: RefreshCcw, tone: 'bg-amber-100 text-amber-700' },
  refund_failed: { Icon: XCircle, tone: 'bg-[var(--color-red-50)] text-[var(--color-red-600)]' },
  converted_from_inquiry: { Icon: PlusCircle, tone: 'bg-emerald-100 text-emerald-700' },
  schedule_blocked: { Icon: Ban, tone: 'bg-[var(--color-charcoal-100)] text-[var(--color-charcoal-700)]' },
};

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
  const today = brtTodayISO();
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

  const { data: testTours } = await admin.from('tours').select('id').eq('is_test_only', true);
  const testTourIds = (testTours ?? []).map((t) => t.id);

  // ===== KPIs =====
  const { data: monthPaymentsRaw } = await admin
    .from('payments')
    .select('amount_cents, booking_id, status, paid_at')
    .eq('status', 'paid')
    .gte('paid_at', monthFrom)
    .lt('paid_at', monthTo);
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

  const { data: refundEvents } = await admin
    .from('booking_events')
    .select('booking_id, created_at, payload')
    .eq('kind', 'refund_succeeded')
    .gte('created_at', monthFrom)
    .lt('created_at', monthTo);
  const refundsCount = (refundEvents ?? []).length;
  const refundBookingIds = (refundEvents ?? []).map((e) => e.booking_id);
  const { data: refundPayments } = refundBookingIds.length
    ? await admin
        .from('payments')
        .select('amount_cents, booking_id')
        .in('booking_id', refundBookingIds)
        .eq('status', 'refunded')
    : { data: [] as Array<{ amount_cents: number; booking_id: string }> };
  const refundsTotalCents = (refundPayments ?? []).reduce(
    (acc, p) => acc + (p.amount_cents ?? 0),
    0
  );

  // ===== Bar chart 14 dias =====
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

  const dayBuckets: Array<{ label: string; dayShort: string; cents: number; isToday: boolean }> = [];
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
      dayShort: dayKey.slice(8),
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
    const idx = dayBuckets.findIndex(
      (b) => b.label === `${dayKey.slice(8)}/${dayKey.slice(5, 7)}`
    );
    if (idx >= 0) dayBuckets[idx].cents += p.amount_cents ?? 0;
  }
  const max14 = Math.max(...dayBuckets.map((b) => b.cents), 1);
  const sum14 = dayBuckets.reduce((a, b) => a + b.cents, 0);

  // ===== Atividade recente =====
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
      {/* Header */}
      <div className="mb-8 md:mb-10">
        <h1
          className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', letterSpacing: '-0.02em' }}
        >
          Dashboard
        </h1>
        <p className="text-sm text-[var(--color-charcoal-500)] mt-2">
          Operação do dia · {DATETIME.format(new Date()).split(',')[0]}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8 md:mb-10">
        <KpiCard
          Icon={DollarSign}
          iconTone="bg-emerald-100 text-emerald-700"
          label="Receita do mês"
          value={PRICE.format(monthRevenueCents / 100)}
          sub="No mês corrente"
        />
        <KpiCard
          Icon={Users}
          iconTone="bg-[var(--color-red-50)] text-[var(--color-red-600)]"
          label="Embarques hoje"
          value={String(todayBookingsCount)}
          sub={`${todayList.length} saída${todayList.length === 1 ? '' : 's'}`}
        />
        <KpiCard
          Icon={Activity}
          iconTone="bg-blue-100 text-blue-700"
          label="Ocupação 7 dias"
          value={`${occupancy7d}%`}
          sub="Média ponderada"
        />
        <KpiCard
          Icon={RotateCcw}
          iconTone="bg-amber-100 text-amber-700"
          label="Reembolsos do mês"
          value={String(refundsCount)}
          sub={refundsTotalCents > 0 ? PRICE.format(refundsTotalCents / 100) : '—'}
        />
      </div>

      {/* Saídas + Receita 14d */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 mb-8">
        {/* Saídas hoje */}
        <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6 md:p-7">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl md:text-2xl font-semibold text-[var(--color-charcoal-900)] tracking-tight">
              Saídas de hoje
            </h2>
            <Link
              href="/admin/manifesto"
              className="text-xs font-bold text-[var(--color-red-600)] hover:text-[var(--color-red-700)] inline-flex items-center gap-1"
            >
              Manifesto <ArrowRight size={12} />
            </Link>
          </div>
          {todayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarIcon size={28} className="text-[var(--color-charcoal-300)] mb-2" />
              <p className="text-sm text-[var(--color-charcoal-500)]">
                Nenhuma saída programada hoje.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {todayList.map((s) => {
                const tour = Array.isArray(s.tour) ? s.tour[0] : s.tour;
                const pct = s.capacity > 0 ? Math.round((s.seats_taken / s.capacity) * 100) : 0;
                const barColor =
                  s.status === 'cancelled'
                    ? 'bg-[var(--color-charcoal-300)]'
                    : pct >= 95
                      ? 'bg-[var(--color-red-600)]'
                      : pct >= 70
                        ? 'bg-amber-500'
                        : pct > 0
                          ? 'bg-emerald-500'
                          : 'bg-[var(--color-charcoal-200)]';
                return (
                  <li key={s.id}>
                    <Link
                      href={`/admin/manifesto/${s.id}`}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--color-charcoal-50)] transition-colors"
                    >
                      <div className="font-mono text-sm font-bold text-[var(--color-charcoal-900)] w-14 shrink-0">
                        {TIME.format(new Date(s.departure_at))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-charcoal-900)] truncate">
                          {tour?.name ?? '—'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--color-charcoal-100)] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-[var(--color-charcoal-500)] tabular-nums whitespace-nowrap">
                            {s.seats_taken}/{s.capacity} · {pct}%
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Receita 14d */}
        <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6 md:p-7">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display text-xl md:text-2xl font-semibold text-[var(--color-charcoal-900)] tracking-tight">
              Receita · 14 dias
            </h2>
          </div>
          <p className="font-display text-2xl font-semibold text-[var(--color-red-600)] mb-5">
            {PRICE.format(sum14 / 100)}
          </p>
          <svg viewBox="0 0 300 120" className="w-full h-32" aria-label="Receita por dia">
            {dayBuckets.map((b, idx) => {
              const colW = 300 / 14;
              const x = idx * colW;
              const h = (b.cents / max14) * 96;
              const y = 100 - h;
              const fill = b.isToday
                ? 'var(--color-red-600)'
                : b.cents > 0
                  ? 'var(--color-charcoal-700)'
                  : 'var(--color-charcoal-200)';
              return (
                <g key={idx}>
                  <rect
                    x={x + 3}
                    y={y}
                    width={colW - 6}
                    height={Math.max(h, 2)}
                    fill={fill}
                    rx={3}
                  >
                    <title>
                      {b.label}: {COMPACT_PRICE.format(b.cents / 100)}
                    </title>
                  </rect>
                  <text
                    x={x + colW / 2}
                    y={114}
                    textAnchor="middle"
                    fontSize="7"
                    fill="var(--color-charcoal-400)"
                  >
                    {b.dayShort}
                  </text>
                </g>
              );
            })}
          </svg>
        </section>
      </div>

      {/* Atividade recente */}
      <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6 md:p-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl md:text-2xl font-semibold text-[var(--color-charcoal-900)] tracking-tight">
            Atividade recente
          </h2>
          <Link
            href="/admin/reservas"
            className="text-xs font-bold text-[var(--color-red-600)] hover:text-[var(--color-red-700)] inline-flex items-center gap-1"
          >
            Ver todas <ArrowRight size={12} />
          </Link>
        </div>
        {recentEvents && recentEvents.length > 0 ? (
          <ul className="space-y-3">
            {recentEvents.map((e) => {
              const code = recentCodeFor.get(e.booking_id);
              const icon = EVENT_ICON[e.kind] ?? EVENT_ICON.created;
              return (
                <li key={e.id} className="flex items-center gap-4">
                  <span
                    className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${icon.tone}`}
                  >
                    <icon.Icon size={16} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-charcoal-900)]">
                      {EVENT_LABEL[e.kind] ?? e.kind}
                    </p>
                    {code && (
                      <Link
                        href={`/admin/reservas/${code}`}
                        className="font-mono text-xs text-[var(--color-charcoal-500)] hover:text-[var(--color-red-600)]"
                      >
                        {code}
                      </Link>
                    )}
                  </div>
                  <span className="text-xs text-[var(--color-charcoal-500)] whitespace-nowrap tabular-nums">
                    {DATETIME.format(new Date(e.created_at))}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-[var(--color-charcoal-500)] py-4 text-center">
            Tudo quieto por aqui.
          </p>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  Icon,
  iconTone,
  label,
  value,
  sub,
}: {
  Icon: typeof DollarSign;
  iconTone: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-5 md:p-6 hover:border-[var(--color-charcoal-200)] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span
          className={`flex items-center justify-center w-10 h-10 rounded-xl ${iconTone}`}
        >
          <Icon size={20} />
        </span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-charcoal-500)] mb-1">
        {label}
      </p>
      <p
        className="font-display font-semibold text-[var(--color-charcoal-900)] leading-tight tracking-tight"
        style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs text-[var(--color-charcoal-500)] mt-2 truncate">{sub}</p>
      )}
    </div>
  );
}
