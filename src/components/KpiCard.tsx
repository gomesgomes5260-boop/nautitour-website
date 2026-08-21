import type { LucideIcon } from 'lucide-react';

export type KpiDelta = {
  /** Variação % vs período de comparação; null = sem base (mostra "novo"). */
  pct: number | null;
  /** false quando subir é RUIM (ex.: reembolsos) — inverte as cores. */
  positiveIsGood?: boolean;
  /** Rótulo curto do que se compara, ex. "vs per. anterior". */
  label?: string;
};

type Props = {
  Icon?: LucideIcon;
  iconTone?: string;
  label: string;
  value: string;
  sub?: string;
  delta?: KpiDelta;
};

export default function KpiCard({ Icon, iconTone, label, value, sub, delta }: Props) {
  return (
    <div className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-5 md:p-6 hover:border-[var(--color-charcoal-200)] transition-colors">
      {Icon && (
        <div className="flex items-center justify-between mb-3">
          <span
            className={`flex items-center justify-center w-10 h-10 rounded-xl ${iconTone ?? 'bg-[var(--color-charcoal-100)] text-[var(--color-charcoal-700)]'}`}
          >
            <Icon size={20} />
          </span>
        </div>
      )}
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-charcoal-500)] mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <p
          className="font-display font-semibold text-[var(--color-charcoal-900)] leading-tight tracking-tight"
          style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
        >
          {value}
        </p>
        {delta && <DeltaTag delta={delta} />}
      </div>
      {sub && (
        <p className="text-xs text-[var(--color-charcoal-500)] mt-2 truncate">{sub}</p>
      )}
      {delta?.label && (
        <p className="text-[10px] text-[var(--color-charcoal-400)] mt-1">{delta.label}</p>
      )}
    </div>
  );
}

function DeltaTag({ delta }: { delta: KpiDelta }) {
  if (delta.pct == null) {
    return (
      <span className="inline-flex items-center rounded-full bg-[var(--color-charcoal-100)] text-[var(--color-charcoal-500)] px-2 py-0.5 text-[10px] font-bold">
        novo
      </span>
    );
  }
  const up = delta.pct >= 0;
  const good = delta.positiveIsGood !== false ? up : !up;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
        good ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
      }`}
      title="Variação vs período de comparação"
    >
      {up ? '▲' : '▼'} {Math.abs(delta.pct) >= 200 ? '>200' : Math.abs(delta.pct).toFixed(0)}%
    </span>
  );
}
