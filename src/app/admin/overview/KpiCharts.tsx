'use client';

import { useState } from 'react';
import {
  DollarSign,
  Users,
  Activity,
  RotateCcw,
  MessageCircle,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import KpiCard, { type KpiDelta } from '@/components/KpiCard';
import AdminBarChart, { type ChartPoint } from '@/components/AdminBarChart';

export type KpiMetric = {
  key: string;
  label: string;
  value: string;
  sub?: string;
  /** Como formatar os valores da série no gráfico. */
  unit: 'brl' | 'int' | 'pct';
  series: ChartPoint[];
  /** Série do período de comparação, alinhada por índice (opcional). */
  compareSeries?: ChartPoint[] | null;
  delta?: KpiDelta;
};

const ICON: Record<string, { Icon: LucideIcon; tone: string }> = {
  receita: { Icon: DollarSign, tone: 'bg-emerald-100 text-emerald-700' },
  embarques: { Icon: Users, tone: 'bg-[var(--color-red-50)] text-[var(--color-red-600)]' },
  ocupacao: { Icon: Activity, tone: 'bg-blue-100 text-blue-700' },
  reembolsos: { Icon: RotateCcw, tone: 'bg-amber-100 text-amber-700' },
  chats: { Icon: MessageCircle, tone: 'bg-green-100 text-green-700' },
};

/**
 * KPIs do dashboard expansíveis: clicar num card abre o gráfico diário
 * daquela métrica no período filtrado (pedido do admin, 05/ago; upgrade
 * 12/ago: AdminBarChart responsivo + comparação de períodos).
 */
export default function KpiCharts({
  metrics,
  todayIso,
  compareLabel,
}: {
  metrics: KpiMetric[];
  todayIso?: string;
  compareLabel?: string;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = metrics.find((m) => m.key === openKey) ?? null;

  return (
    <div className="mb-8 md:mb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
        {metrics.map((m) => {
          const icon = ICON[m.key] ?? ICON.receita;
          const isOpen = m.key === openKey;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setOpenKey(isOpen ? null : m.key)}
              aria-expanded={isOpen}
              aria-controls="kpi-chart-panel"
              className={`text-left relative rounded-2xl transition-shadow ${
                isOpen ? 'ring-2 ring-[var(--color-red-600)]' : ''
              }`}
            >
              <KpiCard
                Icon={icon.Icon}
                iconTone={icon.tone}
                label={m.label}
                value={m.value}
                sub={m.sub}
                delta={m.delta}
              />
              <span
                className={`absolute top-4 right-4 text-[var(--color-charcoal-400)] transition-transform print:hidden ${
                  isOpen ? 'rotate-180' : ''
                }`}
              >
                <ChevronDown size={16} />
              </span>
            </button>
          );
        })}
      </div>

      {open && open.series.length > 0 && (
        <div
          id="kpi-chart-panel"
          className="mt-4 bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-5 sm:p-6"
        >
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)]">
              {open.label} · por dia
            </h3>
            <span className="text-xs text-[var(--color-charcoal-500)]">
              {open.series.length} dia{open.series.length === 1 ? '' : 's'} no período
            </span>
          </div>
          <AdminBarChart
            series={open.series}
            compareSeries={open.compareSeries}
            unit={open.unit}
            todayIso={todayIso}
            compareLabel={compareLabel}
            ariaLabel={`${open.label} por dia`}
          />
        </div>
      )}
    </div>
  );
}
