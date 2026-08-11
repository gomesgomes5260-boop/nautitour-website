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
import KpiCard from '@/components/KpiCard';

export type KpiMetric = {
  key: string;
  label: string;
  value: string;
  sub?: string;
  /** Como formatar os valores da série no gráfico. */
  unit: 'brl' | 'int' | 'pct';
  series: Array<{ label: string; value: number }>;
};

const ICON: Record<string, { Icon: LucideIcon; tone: string }> = {
  receita: { Icon: DollarSign, tone: 'bg-emerald-100 text-emerald-700' },
  embarques: { Icon: Users, tone: 'bg-[var(--color-red-50)] text-[var(--color-red-600)]' },
  ocupacao: { Icon: Activity, tone: 'bg-blue-100 text-blue-700' },
  reembolsos: { Icon: RotateCcw, tone: 'bg-amber-100 text-amber-700' },
  chats: { Icon: MessageCircle, tone: 'bg-green-100 text-green-700' },
};

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

function fmt(unit: KpiMetric['unit'], v: number): string {
  if (unit === 'brl') return BRL.format(v / 100);
  if (unit === 'pct') return `${Math.round(v)}%`;
  return String(v);
}

/**
 * KPIs do dashboard expansíveis: clicar num card abre o gráfico diário
 * daquela métrica no período filtrado (pedido do admin, 05/ago).
 */
export default function KpiCharts({ metrics }: { metrics: KpiMetric[] }) {
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
        <div className="mt-4 bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6 print:hidden">
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)]">
              {open.label} · por dia
            </h3>
            <span className="text-xs text-[var(--color-charcoal-500)]">
              {open.series.length} dia{open.series.length === 1 ? '' : 's'} no período
            </span>
          </div>
          <BarChart series={open.series} unit={open.unit} />
        </div>
      )}
    </div>
  );
}

function BarChart({
  series,
  unit,
}: {
  series: Array<{ label: string; value: number }>;
  unit: KpiMetric['unit'];
}) {
  const max = Math.max(...series.map((s) => s.value), 1);
  const n = series.length;
  const colW = 600 / n;
  // Com muitos dias, mostra label a cada K colunas pra não virar sopa.
  const labelEvery = n > 45 ? 7 : n > 21 ? 3 : 1;

  return (
    <svg viewBox="0 0 600 150" className="w-full h-40" aria-label="Gráfico diário">
      {series.map((s, i) => {
        const h = (s.value / max) * 118;
        const y = 126 - h;
        return (
          <g key={i}>
            <rect
              x={i * colW + Math.min(2, colW * 0.12)}
              y={y}
              width={Math.max(colW - Math.min(4, colW * 0.24), 1)}
              height={Math.max(h, 1.5)}
              rx={Math.min(2.5, colW / 4)}
              fill={s.value > 0 ? 'var(--color-red-600)' : 'var(--color-charcoal-200)'}
            >
              <title>
                {s.label}: {fmt(unit, s.value)}
              </title>
            </rect>
            {i % labelEvery === 0 && (
              <text
                x={i * colW + colW / 2}
                y={140}
                textAnchor="middle"
                fontSize="8"
                fill="var(--color-charcoal-400)"
              >
                {s.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
