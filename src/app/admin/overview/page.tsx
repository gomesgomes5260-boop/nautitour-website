import Link from 'next/link';
import {
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  PlusCircle,
  RefreshCcw,
  Ban,
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import AutoRefresh from '@/components/AutoRefresh';
import AdminPrintButton from '@/components/AdminPrintButton';
import XlsxDownloadButton from '@/components/XlsxDownloadButton';
import { parseDateRange, shortDay } from '@/lib/date-range';
import { getOverviewData } from './data';
import { exportOverviewXlsxAction } from './actions';
import KpiCharts, { type KpiMetric } from './KpiCharts';

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

function dayBoundsBRT(daysOffset = 0): { fromIso: string; toIso: string } {
  const today = brtTodayISO();
  const d = new Date(`${today}T00:00:00-03:00`);
  d.setDate(d.getDate() + daysOffset);
  const fromIso = d.toISOString();
  const next = new Date(d);
  next.setDate(next.getDate() + 1);
  return { fromIso, toIso: next.toISOString() };
}

const inputClass =
  'border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2 text-sm text-[var(--color-charcoal-900)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors';

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const range = parseDateRange(sp.from, sp.to);

  const admin = createAdminClient();
  const data = await getOverviewData(range);
  const { fromIso: todayFrom, toIso: todayTo } = dayBoundsBRT(0);

  // Chats de HOJE (sub do KPI) — independente do range filtrado.
  const { count: waChatsToday } = await admin
    .from('whatsapp_clicks')
    .select('id', { count: 'exact', head: true })
    .gte('clicked_at', todayFrom)
    .lt('clicked_at', todayTo);

  // ===== Saídas de hoje (operacional — sempre "hoje") =====
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
  const todayPax = todayList.reduce((acc, s) => acc + s.seats_taken, 0);

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

  const periodLabel = `${shortDay(range.from)} – ${shortDay(range.to)}`;

  const metrics: KpiMetric[] = [
    {
      key: 'receita',
      label: 'Receita no período',
      value: PRICE.format(data.revenueCents / 100),
      sub: periodLabel,
      unit: 'brl',
      series: data.revenueByDay,
    },
    {
      key: 'embarques',
      label: 'Passageiros no período',
      value: String(data.paxTotal),
      sub: `${todayPax} hoje · ${todayList.length} saída${todayList.length === 1 ? '' : 's'}`,
      unit: 'int',
      series: data.paxByDay,
    },
    {
      key: 'ocupacao',
      label: 'Ocupação média',
      value: `${data.occPct}%`,
      sub: 'saídas do período',
      unit: 'pct',
      series: data.occByDay,
    },
    {
      key: 'reembolsos',
      label: 'Reembolsos no período',
      value: String(data.refundsCount),
      sub: data.refundsTotalCents > 0 ? PRICE.format(data.refundsTotalCents / 100) : '—',
      unit: 'int',
      series: data.refundsByDay,
    },
    {
      key: 'chats',
      label: 'Chats WhatsApp',
      value: String(data.chatsCount),
      sub: `${waChatsToday ?? 0} hoje`,
      unit: 'int',
      series: data.chatsByDay,
    },
  ];

  const maxRev = Math.max(...data.revenueByDay.map((b) => b.value), 1);
  const revLabelEvery = data.days.length > 45 ? 7 : data.days.length > 21 ? 3 : 1;

  return (
    <div>
      {/* Atividade recente atualiza sozinha (fix 05/ago). */}
      <AutoRefresh seconds={60} />

      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', letterSpacing: '-0.02em' }}
          >
            Dashboard
          </h1>
          <p className="text-sm text-[var(--color-charcoal-500)] mt-2">
            Período: {range.from.split('-').reverse().join('/')} a{' '}
            {range.to.split('-').reverse().join('/')}
          </p>
        </div>
        <div className="flex items-end gap-3 flex-wrap print:hidden">
          <form className="flex items-end gap-2 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-[var(--color-charcoal-700)] mb-1.5">
                De
              </label>
              <input type="date" name="from" defaultValue={range.from} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-charcoal-700)] mb-1.5">
                Até
              </label>
              <input type="date" name="to" defaultValue={range.to} className={inputClass} />
            </div>
            <button
              type="submit"
              className="bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
            >
              Filtrar
            </button>
          </form>
          <XlsxDownloadButton
            exportAction={exportOverviewXlsxAction.bind(null, { from: range.from, to: range.to })}
          />
          <AdminPrintButton />
        </div>
      </div>

      {/* KPIs expansíveis (clique abre o gráfico diário) */}
      <KpiCharts metrics={metrics} />

      {/* Saídas + Receita do período */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 mb-8 print:grid-cols-2">
        {/* Saídas hoje */}
        <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6 md:p-7">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl md:text-2xl font-semibold text-[var(--color-charcoal-900)] tracking-tight">
              Saídas de hoje
            </h2>
            <Link
              href="/admin/manifesto"
              className="text-xs font-bold text-[var(--color-red-600)] hover:text-[var(--color-red-700)] inline-flex items-center gap-1 print:hidden"
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

        {/* Receita do período */}
        <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6 md:p-7">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-display text-xl md:text-2xl font-semibold text-[var(--color-charcoal-900)] tracking-tight">
              Receita · período
            </h2>
            <span className="text-xs text-[var(--color-charcoal-500)]">{periodLabel}</span>
          </div>
          <p className="font-display text-2xl font-semibold text-[var(--color-red-600)] mb-5">
            {PRICE.format(data.revenueCents / 100)}
          </p>
          <svg viewBox="0 0 300 120" className="w-full h-32" aria-label="Receita por dia">
            {data.revenueByDay.map((b, idx) => {
              const colW = 300 / data.days.length;
              const x = idx * colW;
              const h = (b.value / maxRev) * 96;
              const y = 100 - h;
              const isToday = b.day === brtTodayISO();
              const fill = isToday
                ? 'var(--color-red-600)'
                : b.value > 0
                  ? 'var(--color-charcoal-700)'
                  : 'var(--color-charcoal-200)';
              return (
                <g key={idx}>
                  <rect
                    x={x + Math.min(3, colW * 0.15)}
                    y={y}
                    width={Math.max(colW - Math.min(6, colW * 0.3), 0.8)}
                    height={Math.max(h, 2)}
                    fill={fill}
                    rx={Math.min(3, colW / 4)}
                  >
                    <title>
                      {b.label}: {COMPACT_PRICE.format(b.value / 100)}
                    </title>
                  </rect>
                  {idx % revLabelEvery === 0 && (
                    <text
                      x={x + colW / 2}
                      y={114}
                      textAnchor="middle"
                      fontSize="7"
                      fill="var(--color-charcoal-400)"
                    >
                      {data.days.length > 21 ? b.label : b.day.slice(8)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </section>
      </div>

      {/* Atividade recente */}
      <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6 md:p-7 print:hidden">
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
