import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Clock,
  RotateCcw,
  Ban,
} from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import AdminPrintButton from '@/components/AdminPrintButton';
import XlsxDownloadButton from '@/components/XlsxDownloadButton';
import { parseDateRange } from '@/lib/date-range';
import { getFinanceData } from './data';
import { exportFinanceXlsxAction } from './actions';

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

const inputClass =
  'border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2 text-sm text-[var(--color-charcoal-900)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors';

export default async function AdminFinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;

  // Dois modos: mês (navegação ← →, padrão) ou período personalizado
  // (from/to) — pedido do admin, 05/ago.
  const isCustom = Boolean(sp.from || sp.to);
  const { year, month } = parseMonthParam(sp.month);
  const custom = parseDateRange(sp.from, sp.to);
  const { fromIso, toIso } = isCustom
    ? { fromIso: custom.fromIso, toIso: custom.toIso }
    : monthBoundsISO(year, month);
  const periodLabel = isCustom
    ? `${custom.from.split('-').reverse().join('/')} a ${custom.to.split('-').reverse().join('/')}`
    : monthLabel(year, month);

  const data = await getFinanceData(fromIso, toIso);

  const prevMonth = shiftMonthParam(year, month, -1);
  const nextMonth = shiftMonthParam(year, month, +1);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1
          className="font-display font-semibold text-[var(--color-charcoal-900)] tracking-tight"
          style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
        >
          Financeiro · {periodLabel}
        </h1>
        <div className="flex gap-2 print:hidden">
          {!isCustom && (
            <>
              <MonthNav href={`/admin/financeiro?month=${prevMonth}`} icon={<ChevronLeft size={14} />} label="Mês anterior" iconLeft />
              <MonthNav href="/admin/financeiro" label="Hoje" />
              <MonthNav href={`/admin/financeiro?month=${nextMonth}`} icon={<ChevronRight size={14} />} label="Próximo mês" />
            </>
          )}
          {isCustom && <MonthNav href="/admin/financeiro" label="Voltar pro mês" />}
        </div>
      </div>

      {/* Período personalizado + exports */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6 print:hidden">
        <form className="flex items-end gap-2 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-[var(--color-charcoal-700)] mb-1.5">
              De
            </label>
            <input type="date" name="from" defaultValue={isCustom ? custom.from : ''} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-charcoal-700)] mb-1.5">
              Até
            </label>
            <input type="date" name="to" defaultValue={isCustom ? custom.to : ''} className={inputClass} />
          </div>
          <button
            type="submit"
            className="bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
          >
            Aplicar período
          </button>
        </form>
        <div className="flex items-center gap-3">
          <XlsxDownloadButton
            exportAction={exportFinanceXlsxAction.bind(null, {
              fromIso,
              toIso,
              label: periodLabel,
            })}
          />
          <AdminPrintButton />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          Icon={DollarSign}
          iconTone="bg-emerald-50 text-emerald-700"
          label="Receita do período"
          value={PRICE.format(data.revenueCents / 100)}
        />
        <KpiCard
          Icon={Clock}
          iconTone="bg-amber-50 text-amber-700"
          label="A receber"
          value={PRICE.format(data.pendingTotalCents / 100)}
          sub={`${data.pendingCount} pendente${data.pendingCount === 1 ? '' : 's'}`}
        />
        <KpiCard
          Icon={RotateCcw}
          iconTone="bg-sky-50 text-sky-700"
          label="Reembolsos"
          value={String(data.refundsCount)}
          sub={data.refundsTotalCents > 0 ? PRICE.format(data.refundsTotalCents / 100) : '—'}
        />
        <KpiCard
          Icon={Ban}
          iconTone="bg-[var(--color-red-50)] text-[var(--color-red-600)]"
          label="Cancelados"
          value={String(data.cancelledCount)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 print:grid-cols-2">
        <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)] mb-4">
            Receita por método
          </h2>
          {data.methodRows.length === 0 ? (
            <p className="text-sm text-[var(--color-charcoal-500)]">
              Sem pagamentos neste período.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.methodRows.map((m) => (
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
          {data.tourRows.length === 0 ? (
            <p className="text-sm text-[var(--color-charcoal-500)]">
              Sem pagamentos neste período.
            </p>
          ) : (
            <>
              {/* Stacked bar 100% */}
              <div className="h-2.5 bg-[var(--color-charcoal-100)] rounded-full overflow-hidden flex mb-4">
                {data.tourRows.map((t, i) => (
                  <div
                    key={t.tourId}
                    className={`h-full ${TOUR_COLORS[i % TOUR_COLORS.length]}`}
                    style={{ width: `${t.pct * 100}%` }}
                    title={`${t.name}: ${PRICE.format(t.cents / 100)}`}
                  />
                ))}
              </div>
              <ul className="space-y-2 text-sm text-[var(--color-charcoal-700)]">
                {data.tourRows.map((t, i) => (
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

      <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl overflow-hidden print:border-0 print:rounded-none">
        <div className="px-6 py-4 border-b border-[var(--color-charcoal-100)] flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)]">
            Últimas transações
          </h2>
          <span className="text-xs text-[var(--color-charcoal-500)]">
            mostrando {Math.min(20, data.transactions.length)} de {data.transactions.length}
            <span className="hidden print:inline"> · completo no Excel</span>
          </span>
        </div>
        {data.transactions.length === 0 ? (
          <p className="px-6 py-8 text-sm text-[var(--color-charcoal-500)] text-center">
            Sem transações neste período.
          </p>
        ) : (
          <table className="w-full text-sm print:text-[10px]">
            <thead className="bg-[var(--color-charcoal-50)] text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-charcoal-500)]">
              <tr>
                <th className="px-4 py-3 print:px-1.5 print:py-1">Quando</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1">Reserva</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1">Cliente</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 hidden md:table-cell">Tour</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1">Método</th>
                <th className="px-4 py-3 print:px-1.5 print:py-1 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.slice(0, 20).map((t, i) => (
                <tr
                  key={`${t.bookingCode ?? i}-${t.paidAt ?? i}`}
                  className="border-t border-[var(--color-charcoal-100)] hover:bg-[var(--color-charcoal-50)]/60"
                >
                  <td className="px-4 py-3 print:px-1.5 print:py-1 text-[var(--color-charcoal-500)] text-xs">
                    {t.paidAt ? DATETIME.format(new Date(t.paidAt)) : '—'}
                  </td>
                  <td className="px-4 py-3 print:px-1.5 print:py-1 font-mono text-xs">
                    {t.bookingCode ? (
                      <Link
                        href={`/admin/reservas/${t.bookingCode}`}
                        className="text-[var(--color-charcoal-700)] underline-offset-2 hover:underline"
                      >
                        {t.bookingCode}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 print:px-1.5 print:py-1 text-[var(--color-charcoal-900)]">
                    {t.customerName}
                  </td>
                  <td className="px-4 py-3 print:px-1.5 print:py-1 hidden md:table-cell text-[var(--color-charcoal-500)]">
                    {t.tourName}
                  </td>
                  <td className="px-4 py-3 print:px-1.5 print:py-1 text-xs text-[var(--color-charcoal-700)]">
                    {METHOD_LABEL[t.method] ?? t.method}
                  </td>
                  <td className="px-4 py-3 print:px-1.5 print:py-1 text-right font-mono text-[var(--color-charcoal-900)]">
                    {PRICE.format(t.amountCents / 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="text-xs text-[var(--color-charcoal-500)] mt-3 print:hidden">
        Tour de teste (R$ 1) é excluído de todos os KPIs e gráficos. O Excel
        traz o resumo, quebras por método/produto e TODAS as transações do
        período.
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
