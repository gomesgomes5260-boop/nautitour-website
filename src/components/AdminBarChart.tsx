'use client';

import { useMemo, useState } from 'react';

// Gráfico de barras canônico do admin (substitui os 2 SVGs antigos de
// overview). Barras em <div> com altura em % — texto fica em pixels reais
// (legível em qualquer largura), tooltip funciona por toque no mobile e a
// série de comparação entra como barra fantasma cinza atrás da atual.

export type ChartPoint = { day: string; label: string; value: number };

type Unit = 'brl' | 'int' | 'pct';

type Props = {
  series: ChartPoint[];
  /** Série do período de comparação, alinhada POR ÍNDICE com `series`. */
  compareSeries?: ChartPoint[] | null;
  unit: Unit;
  /** YYYY-MM-DD de hoje (BRT) pra destacar a barra do dia. */
  todayIso?: string;
  ariaLabel: string;
  /** Ex.: "período anterior" / "mesmo período de 2025". */
  compareLabel?: string;
  /** Altura tailwind da área de barras (default h-40 sm:h-48). */
  heightClass?: string;
};

const BRL_FULL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});
const BRL_COMPACT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const INT = new Intl.NumberFormat('pt-BR');

function fmt(unit: Unit, v: number, compact = false): string {
  if (unit === 'brl') return (compact ? BRL_COMPACT : BRL_FULL).format(v / 100);
  if (unit === 'pct') return `${Math.round(v)}%`;
  return INT.format(v);
}

/** Total do período: soma, exceto pct (média dos dias com saída). */
function aggregate(unit: Unit, series: ChartPoint[]): number {
  if (unit === 'pct') {
    const nonZero = series.filter((s) => s.value > 0);
    if (nonZero.length === 0) return 0;
    return nonZero.reduce((acc, s) => acc + s.value, 0) / nonZero.length;
  }
  return series.reduce((acc, s) => acc + s.value, 0);
}

export default function AdminBarChart({
  series,
  compareSeries,
  unit,
  todayIso,
  ariaLabel,
  compareLabel,
  heightClass = 'h-40 sm:h-48',
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const compare = compareSeries && compareSeries.length > 0 ? compareSeries : null;
  const n = series.length;
  const max = useMemo(
    () =>
      Math.max(
        1,
        ...series.map((s) => s.value),
        ...(compare ? compare.map((s) => s.value) : [])
      ),
    [series, compare]
  );
  const labelEvery = n > 60 ? 14 : n > 45 ? 7 : n > 21 ? 5 : n > 10 ? 2 : 1;
  const showBarValues = n <= 15;

  const total = aggregate(unit, series);
  const compareTotal = compare ? aggregate(unit, compare) : null;
  const totalDeltaPct =
    compareTotal != null && compareTotal !== 0
      ? ((total - compareTotal) / compareTotal) * 100
      : null;

  const sel = selected != null ? series[selected] : null;
  const selCompare = selected != null && compare ? (compare[selected] ?? null) : null;
  const selDeltaPct =
    sel && selCompare && selCompare.value !== 0
      ? ((sel.value - selCompare.value) / selCompare.value) * 100
      : null;

  if (n === 0) {
    return (
      <p className="text-sm text-[var(--color-charcoal-500)] py-8 text-center">
        Sem dados no período.
      </p>
    );
  }

  return (
    <figure
      aria-label={ariaLabel}
      className="m-0"
      style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
    >
      {/* Linha de leitura: total do período + dia selecionado */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
        <p className="text-sm text-[var(--color-charcoal-700)]">
          <span className="font-bold text-[var(--color-charcoal-900)]">
            {fmt(unit, total)}
          </span>{' '}
          {unit === 'pct' ? 'de média no período' : 'no período'}
          {compareTotal != null && (
            <span className="text-xs text-[var(--color-charcoal-500)]">
              {' '}· {compareLabel ?? 'comparação'}: {fmt(unit, compareTotal)}{' '}
              {totalDeltaPct != null && (
                <DeltaBadge pct={totalDeltaPct} />
              )}
            </span>
          )}
        </p>
        <p className="text-xs text-[var(--color-charcoal-500)] tabular-nums min-h-4">
          {sel ? (
            <>
              <span className="font-semibold text-[var(--color-charcoal-900)]">
                {sel.label}
              </span>
              : {fmt(unit, sel.value)}
              {selCompare && (
                <>
                  {' '}· antes: {fmt(unit, selCompare.value)}{' '}
                  {selDeltaPct != null && <DeltaBadge pct={selDeltaPct} />}
                </>
              )}
            </>
          ) : (
            <span className="print:hidden">Toque numa barra pra ver o dia</span>
          )}
        </p>
      </div>

      {/* Área do gráfico com gridlines + labels do eixo Y */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          {/* gridlines 100% / 50% / 0 */}
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-[var(--color-charcoal-200)]" aria-hidden />
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[var(--color-charcoal-100)]" aria-hidden />
          <div
            className={`relative flex items-end gap-px sm:gap-0.5 ${heightClass} border-b border-[var(--color-charcoal-200)]`}
            role="img"
            aria-label={ariaLabel}
          >
            {series.map((point, i) => {
              const isToday = todayIso != null && point.day === todayIso;
              const isSelected = selected === i;
              const curPct = (point.value / max) * 100;
              const ghost = compare?.[i];
              const ghostPct = ghost ? (ghost.value / max) * 100 : 0;
              return (
                <button
                  key={point.day}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : i)}
                  aria-label={`${point.label}: ${fmt(unit, point.value)}${
                    ghost ? ` (antes: ${fmt(unit, ghost.value)})` : ''
                  }`}
                  aria-pressed={isSelected}
                  title={`${point.label}: ${fmt(unit, point.value)}`}
                  className={`relative flex-1 h-full flex items-end justify-center min-w-0 group focus:outline-none ${
                    isSelected ? 'bg-[var(--color-charcoal-50)]' : ''
                  }`}
                >
                  {/* barra fantasma do período de comparação */}
                  {ghost && ghostPct > 0 && (
                    <span
                      aria-hidden
                      className="absolute bottom-0 inset-x-0 mx-auto w-full rounded-t-[3px] bg-[var(--color-charcoal-200)]"
                      style={{ height: `${Math.max(ghostPct, 1)}%` }}
                    />
                  )}
                  {/* valor no topo (períodos curtos, só telas ≥sm) */}
                  {showBarValues && point.value > 0 && (
                    <span className="hidden sm:block absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-[var(--color-charcoal-500)] whitespace-nowrap tabular-nums">
                      {fmt(unit, point.value, true)}
                    </span>
                  )}
                  {/* barra do período atual */}
                  <span
                    aria-hidden
                    className={`relative w-[68%] rounded-t-[3px] transition-[filter] group-hover:brightness-90 ${
                      point.value === 0
                        ? 'bg-[var(--color-charcoal-200)]'
                        : isToday
                          ? 'bg-[var(--color-red-600)]'
                          : 'bg-[var(--color-charcoal-700)]'
                    } ${isSelected ? 'ring-2 ring-[var(--color-red-600)] ring-offset-1' : ''}`}
                    style={{ height: `${Math.max(curPct, point.value === 0 ? 1.5 : 3)}%` }}
                  />
                </button>
              );
            })}
          </div>
          {/* labels do eixo X */}
          <div className="flex gap-px sm:gap-0.5 mt-1.5">
            {series.map((point, i) => (
              <span
                key={point.day}
                className="flex-1 min-w-0 text-center text-[10px] text-[var(--color-charcoal-400)] tabular-nums overflow-visible whitespace-nowrap"
              >
                {i % labelEvery === 0 ? (n > 21 ? point.label : point.day.slice(8)) : ''}
              </span>
            ))}
          </div>
        </div>
        {/* eixo Y (máx / metade / zero) */}
        <div className={`relative w-12 shrink-0 ${heightClass} text-right`} aria-hidden>
          <span className="absolute top-0 right-0 -translate-y-1/2 text-[10px] text-[var(--color-charcoal-400)] tabular-nums">
            {fmt(unit, max, true)}
          </span>
          <span className="absolute top-1/2 right-0 -translate-y-1/2 text-[10px] text-[var(--color-charcoal-400)] tabular-nums">
            {fmt(unit, max / 2, true)}
          </span>
          <span className="absolute bottom-0 right-0 translate-y-1/2 text-[10px] text-[var(--color-charcoal-400)] tabular-nums">
            0
          </span>
        </div>
      </div>

      {/* legenda quando há comparação */}
      {compare && (
        <div className="flex items-center gap-4 mt-3 text-[11px] text-[var(--color-charcoal-500)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-[var(--color-charcoal-700)]" aria-hidden />
            período atual
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-[var(--color-charcoal-200)]" aria-hidden />
            {compareLabel ?? 'comparação'}
          </span>
          {todayIso && series.some((s) => s.day === todayIso) && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-[3px] bg-[var(--color-red-600)]" aria-hidden />
              hoje
            </span>
          )}
        </div>
      )}
    </figure>
  );
}

/** Badge de variação: verde subiu, vermelho caiu (uso neutro — sem semântica de "bom/ruim"). */
function DeltaBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
        up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {up ? '▲' : '▼'} {Math.abs(pct) >= 200 ? '>200' : Math.abs(pct).toFixed(0)}%
    </span>
  );
}
