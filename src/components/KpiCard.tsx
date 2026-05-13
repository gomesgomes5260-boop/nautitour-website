import type { LucideIcon } from 'lucide-react';

type Props = {
  Icon?: LucideIcon;
  iconTone?: string;
  label: string;
  value: string;
  sub?: string;
};

export default function KpiCard({ Icon, iconTone, label, value, sub }: Props) {
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
