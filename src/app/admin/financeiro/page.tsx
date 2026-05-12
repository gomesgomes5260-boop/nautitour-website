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
  credit_card: 'bg-[rgb(9,110,171)]',
  boleto: 'bg-amber-500',
};

// Cores rotativas pra "Receita por produto" (no order: tours por slug)
const TOUR_COLORS = [
  'bg-[rgb(9,110,171)]', // azul
  'bg-[rgb(217,0,6)]',   // vermelho
  'bg-emerald-600',
  'bg-amber-500',
  'bg-purple-500',
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Financeiro · {monthLabel(year, month)}</h1>
        <div className="flex gap-2">
          <Link
            href={`/admin/financeiro?month=${prevMonth}`}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
          >
            ← Mês anterior
          </Link>
          <Link
            href="/admin/financeiro"
            className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
          >
            Hoje
          </Link>
          <Link
            href={`/admin/financeiro?month=${nextMonth}`}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
          >
            Próximo mês →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi label="Receita do mês" value={PRICE.format(monthRevenue / 100)} />
        <Kpi
          label="A receber"
          value={PRICE.format(pendingTotal / 100)}
          sub={`${pendingCount} pendente${pendingCount === 1 ? '' : 's'}`}
        />
        <Kpi
          label="Reembolsos"
          value={String(refundsCount)}
          sub={refundsTotal > 0 ? PRICE.format(refundsTotal / 100) : '—'}
        />
        <Kpi label="Cancelados" value={String(cancelledCount)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <section className="bg-white border border-gray-200 rounded-md p-6">
          <h2 className="text-lg font-semibold mb-4">Receita por método</h2>
          {methodRows.length === 0 ? (
            <p className="text-sm text-gray-500">Sem pagamentos neste mês.</p>
          ) : (
            <ul className="space-y-3">
              {methodRows.map((m) => (
                <li key={m.method}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{METHOD_LABEL[m.method] ?? m.method}</span>
                    <span className="font-mono">
                      {COMPACT_PRICE.format(m.cents / 100)} ·{' '}
                      {(m.pct * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded overflow-hidden">
                    <div
                      className={`h-full ${METHOD_COLOR[m.method] ?? 'bg-gray-400'}`}
                      style={{ width: `${Math.max(2, m.pct * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-md p-6">
          <h2 className="text-lg font-semibold mb-4">Receita por produto</h2>
          {tourRows.length === 0 ? (
            <p className="text-sm text-gray-500">Sem pagamentos neste mês.</p>
          ) : (
            <>
              {/* Stacked bar 100% */}
              <div className="h-3 bg-gray-100 rounded overflow-hidden flex mb-4">
                {tourRows.map((t, i) => (
                  <div
                    key={t.tourId}
                    className={`h-full ${TOUR_COLORS[i % TOUR_COLORS.length]}`}
                    style={{ width: `${t.pct * 100}%` }}
                    title={`${t.name}: ${PRICE.format(t.cents / 100)}`}
                  />
                ))}
              </div>
              <ul className="space-y-2 text-sm">
                {tourRows.map((t, i) => (
                  <li key={t.tourId} className="flex items-center gap-2">
                    <span className={`inline-block w-3 h-3 rounded ${TOUR_COLORS[i % TOUR_COLORS.length]}`} />
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

      <section className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Últimas transações</h2>
          <span className="text-xs text-gray-500">
            mostrando {Math.min(20, validPayments.length)} de {validPayments.length}
          </span>
        </div>
        {validPayments.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500 text-center">
            Sem transações neste mês.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-2">Quando</th>
                <th className="px-4 py-2">Reserva</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2 hidden md:table-cell">Tour</th>
                <th className="px-4 py-2">Método</th>
                <th className="px-4 py-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {validPayments.slice(0, 20).map((p) => {
                const b = bookingById.get(p.booking_id);
                const c = b ? customerById.get(b.customer_id) : null;
                const tour = b ? toursById.get(b.tour_id) : null;
                return (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-gray-600 text-xs">
                      {p.paid_at ? DATETIME.format(new Date(p.paid_at)) : '—'}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {b ? (
                        <Link
                          href={`/admin/reservas/${b.booking_code}`}
                          className="text-[rgb(9,110,171)] hover:underline"
                        >
                          {b.booking_code}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2">{c?.full_name ?? c?.email ?? '—'}</td>
                    <td className="px-4 py-2 hidden md:table-cell text-gray-600">
                      {tour?.name ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {METHOD_LABEL[p.payment_method] ?? p.payment_method}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {PRICE.format(p.amount_cents / 100)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <p className="text-xs text-gray-500 mt-3">
        Tour de teste (R$ 1) é excluído de todos os KPIs e gráficos.
      </p>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}
