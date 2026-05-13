import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Clock,
  RotateCcw,
  Ban,
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import KpiCard from '@/components/KpiCard';

export const dynamic = 'force-dynamic';

const DATETIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
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

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const METHOD_LABEL: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de crédito',
  boleto: 'Boleto',
};

const METHOD_COLOR: Record<string, string> = {
  pix: 'bg-emerald-500',
  credit_card: 'bg-[var(--color-charcoal-700)]',
  boleto: 'bg-amber-500',
};

// Cores rotativas pra "Receita por produto" — paleta consistente com brand
const TOUR_COLORS = [
  'bg-[var(--color-red-600)]',
  'bg-[var(--color-charcoal-700)]',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-sky-500',
];

function brtTodayParts(): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get('year'), month: get('month') };
}

function parseMonthParam(raw: string | undefined): { year: number; month: number } {
  const today = brtTodayParts();
  if (!raw) return today;
  const m = raw.match(/^(\d{4})-(\d{2})$/);
  if (!m) return today;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return today;
  return { year: y, month: mo };
}

function monthLabel(y: number, m: number): string {
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function shiftMonthParam(y: number, m: number, delta: number): string {
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthBoundsISO(year: number, month: number): { fromIso: string; toIso: string } {
  const fromIso = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00-03:00`).toISOString();
  const next = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00-03:00`);
  next.setMonth(next.getMonth() + 1);
  return { fromIso, toIso: next.toISOString() };
}

export default async function AdminFinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const { year, month } = parseMonthParam(sp.month);
  const { fromIso, toIso } = monthBoundsISO(year, month);

  const admin = createAdminClient();

  // Excluir tour-de-teste
  const { data: tours } = await admin.from('tours').select('id, name, slug, is_test_only').order('name');
  const toursById = new Map((tours ?? []).map((t) => [t.id, t]));
  const testTourIds = (tours ?? []).filter((t) => t.is_test_only).map((t) => t.id);

  // Pagamentos pagos no mês
  const { data: paymentsRaw } = await admin
    .from('payments')
    .select('id, amount_cents, payment_method, paid_at, booking_id, status, created_at')
    .eq('status', 'paid')
    .gte('paid_at', fromIso)
    .lt('paid_at', toIso)
    .order('paid_at', { ascending: false });

  // Bookings desses payments (pra associar tour_id e booking_code)
  const bookingIds = (paymentsRaw ?? []).map((p) => p.booking_id);
  const { data: bookingsRaw } = bookingIds.length
    ? await admin
        .from('bookings')
        .select('id, booking_code, tour_id, customer_id')
        .in('id', bookingIds)
    : { data: [] as Array<{ id: string; booking_code: string; tour_id: string; customer_id: string }> };
  const bookingById = new Map((bookingsRaw ?? []).map((b) => [b.id, b]));

  // Customers (pra mostrar nome na tabela)
  const customerIds = (bookingsRaw ?? []).map((b) => b.customer_id);
  const { data: customersRaw } = customerIds.length
    ? await admin
        .from('customers')
        .select('id, full_name, email')
        .in('id', customerIds)
    : { data: [] as Array<{ id: string; full_name: string | null; email: string }> };
  const customerById = new Map((customersRaw ?? []).map((c) => [c.id, c]));

  // Filtra payments pra excluir tour-de-teste
  const validPayments = (paymentsRaw ?? []).filter((p) => {
    const b = bookingById.get(p.booking_id);
    return b && !testTourIds.includes(b.tour_id);
  });

  // KPI: Receita do mês (caixa)
  const monthRevenue = validPayments.reduce((acc, p) => acc + (p.amount_cents ?? 0), 0);

  // KPI: A receber (pending_payment ainda não-expirado, exclui teste)
  const { data: pendingRaw } = await admin
    .from('bookings')
    .select('total_cents, tour_id, expires_at')
    .eq('status', 'pending_payment');
  const pendingTotal = (pendingRaw ?? []).reduce((acc, b) => {
    if (testTourIds.includes(b.tour_id)) return acc;
    if (b.expires_at && new Date(b.expires_at) < new Date()) return acc;
    return acc + (b.total_cents ?? 0);
  }, 0);
  const pendingCount = (pendingRaw ?? []).filter(
    (b) =>
      !testTourIds.includes(b.tour_id) &&
      (!b.expires_at || new Date(b.expires_at) >= new Date())
  ).length;

  // KPI: Reembolsos do mês (refund_succeeded events)
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
  const refundsTotal = (refundPaymentsRaw ?? []).reduce((acc, p) => {
    const b = bookingById.get(p.booking_id);
    // Reembolsos podem ser de bookings de mês anterior — verifica tour-de-teste igual
    if (b && testTourIds.includes(b.tour_id)) return acc;
    return acc + (p.amount_cents ?? 0);
  }, 0);
  const refundsCount = (refundEvents ?? []).length;

  // KPI: Cancelados (admin_cancelled + customer_cancelled events)
  const { data: cancelEvents } = await admin
    .from('booking_events')
    .select('booking_id')
    .in('kind', ['admin_cancelled', 'customer_cancelled'])
    .gte('created_at', fromIso)
    .lt('created_at', toIso);
  const cancelledCount = (cancelEvents ?? []).length;

  // Receita por método
  const methodAgg = new Map<string, number>();
  for (const p of validPayments) {
    const cur = methodAgg.get(p.payment_method) ?? 0;
    methodAgg.set(p.payment_method, cur + p.amount_cents);
  }
  const methodRows = Array.from(methodAgg.entries())
    .map(([method, cents]) => ({ method, cents, pct: monthRevenue > 0 ? cents / monthRevenue : 0 }))
    .sort((a, b) => b.cents - a.cents);

  // Receita por produto (tour)
  const tourAgg = new Map<string, number>();
  for (const p of validPayments) {
    const b = bookingById.get(p.booking_id);
    if (!b) continue;
    const cur = tourAgg.get(b.tour_id) ?? 0;
    tourAgg.set(b.tour_id, cur + p.amount_cents);
  }
  const tourRows = Array.from(tourAgg.entries())
    .map(([tourId, cents]) => ({
      tourId,
      name: toursById.get(tourId)?.name ?? '—',
      cents,
      pct: monthRevenue > 0 ? cents / monthRevenue : 0,
    }))
    .sort((a, b) => b.cents - a.cents);

  const prevMonth = shiftMonthParam(year, month, -1);
  const nextMonth = shiftMonthParam(year, month, +1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1
          className="font-display font-semibold text-[var(--color-charcoal-900)] tracking-tight"
          style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
        >
          Financeiro · {monthLabel(year, month)}
        </h1>
        <div className="flex gap-2">
          <MonthNav href={`/admin/financeiro?month=${prevMonth}`} icon={<ChevronLeft size={14} />} label="Mês anterior" iconLeft />
          <MonthNav href="/admin/financeiro" label="Hoje" />
          <MonthNav href={`/admin/financeiro?month=${nextMonth}`} icon={<ChevronRight size={14} />} label="Próximo mês" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          Icon={DollarSign}
          iconTone="bg-emerald-50 text-emerald-700"
          label="Receita do mês"
          value={PRICE.format(monthRevenue / 100)}
        />
        <KpiCard
          Icon={Clock}
          iconTone="bg-amber-50 text-amber-700"
          label="A receber"
          value={PRICE.format(pendingTotal / 100)}
          sub={`${pendingCount} pendente${pendingCount === 1 ? '' : 's'}`}
        />
        <KpiCard
          Icon={RotateCcw}
          iconTone="bg-sky-50 text-sky-700"
          label="Reembolsos"
          value={String(refundsCount)}
          sub={refundsTotal > 0 ? PRICE.format(refundsTotal / 100) : '—'}
        />
        <KpiCard
          Icon={Ban}
          iconTone="bg-[var(--color-red-50)] text-[var(--color-red-600)]"
          label="Cancelados"
          value={String(cancelledCount)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)] mb-4">
            Receita por método
          </h2>
          {methodRows.length === 0 ? (
            <p className="text-sm text-[var(--color-charcoal-500)]">
              Sem pagamentos neste mês.
            </p>
          ) : (
            <ul className="space-y-3">
              {methodRows.map((m) => (
                <li key={m.method}>
                  <div className="flex justify-between text-sm mb-1.5 text-[var(--color-charcoal-700)]">
                    <span>{METHOD_LABEL[m.method] ?? m.method}</span>
                    <span className="font-mono">
                      {COMPACT_PRICE.format(m.cents / 100)} ·{' '}
                      {(m.pct * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-[var(--color-charcoal-100)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${METHOD_COLOR[m.method] ?? 'bg-[var(--color-charcoal-400)]'}`}
                      style={{ width: `${Math.max(2, m.pct * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)] mb-4">
            Receita por produto
          </h2>
          {tourRows.length === 0 ? (
            <p className="text-sm text-[var(--color-charcoal-500)]">
              Sem pagamentos neste mês.
            </p>
          ) : (
            <>
              {/* Stacked bar 100% */}
              <div className="h-2.5 bg-[var(--color-charcoal-100)] rounded-full overflow-hidden flex mb-4">
                {tourRows.map((t, i) => (
                  <div
                    key={t.tourId}
                    className={`h-full ${TOUR_COLORS[i % TOUR_COLORS.length]}`}
                    style={{ width: `${t.pct * 100}%` }}
                    title={`${t.name}: ${PRICE.format(t.cents / 100)}`}
                  />
                ))}
              </div>
              <ul className="space-y-2 text-sm text-[var(--color-charcoal-700)]">
                {tourRows.map((t, i) => (
                  <li key={t.tourId} className="flex items-center gap-2">
                    <span className={`inline-block w-3 h-3 rounded-full ${TOUR_COLORS[i % TOUR_COLORS.length]}`} />
                    <span className="flex-1">{t.name}</span>
                    <span className="font-mono">
                      {COMPACT_PRICE.format(t.cents / 100)} ·{' '}
                      {(t.pct * 100).toFixed(0)}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-charcoal-100)] flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)]">
            Últimas transações
          </h2>
          <span className="text-xs text-[var(--color-charcoal-500)]">
            mostrando {Math.min(20, validPayments.length)} de {validPayments.length}
          </span>
        </div>
        {validPayments.length === 0 ? (
          <p className="px-6 py-8 text-sm text-[var(--color-charcoal-500)] text-center">
            Sem transações neste mês.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-charcoal-50)] text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-charcoal-500)]">
              <tr>
                <th className="px-4 py-3">Quando</th>
                <th className="px-4 py-3">Reserva</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3 hidden md:table-cell">Tour</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {validPayments.slice(0, 20).map((p) => {
                const b = bookingById.get(p.booking_id);
                const c = b ? customerById.get(b.customer_id) : null;
                const tour = b ? toursById.get(b.tour_id) : null;
                return (
                  <tr
                    key={p.id}
                    className="border-t border-[var(--color-charcoal-100)] hover:bg-[var(--color-charcoal-50)]/60"
                  >
                    <td className="px-4 py-3 text-[var(--color-charcoal-500)] text-xs">
                      {p.paid_at ? DATETIME.format(new Date(p.paid_at)) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {b ? (
                        <Link
                          href={`/admin/reservas/${b.booking_code}`}
                          className="text-[var(--color-charcoal-700)] underline-offset-2 hover:underline"
                        >
                          {b.booking_code}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-charcoal-900)]">
                      {c?.full_name ?? c?.email ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[var(--color-charcoal-500)]">
                      {tour?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-charcoal-700)]">
                      {METHOD_LABEL[p.payment_method] ?? p.payment_method}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--color-charcoal-900)]">
                      {PRICE.format(p.amount_cents / 100)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <p className="text-xs text-[var(--color-charcoal-500)] mt-3">
        Tour de teste (R$ 1) é excluído de todos os KPIs e gráficos.
      </p>
    </div>
  );
}

function MonthNav({
  href,
  label,
  icon,
  iconLeft,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
  iconLeft?: boolean;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border border-[var(--color-charcoal-200)] text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] hover:border-[var(--color-charcoal-300)] transition-colors"
    >
      {iconLeft && icon}
      {label}
      {!iconLeft && icon}
    </Link>
  );
}
