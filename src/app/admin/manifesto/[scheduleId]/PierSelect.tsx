'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, AlertTriangle } from 'lucide-react';
import { setPierAction } from './actions';
import { formatPierFee } from '@/lib/piers';

type PierOption = {
  slug: string;
  name: string;
  fee_cents: number;
  address: string | null;
};

type Props = {
  scheduleId: string;
  piers: PierOption[];
  currentSlug: string;
};

export default function PierSelect({ scheduleId, piers, currentSlug }: Props) {
  const [selected, setSelected] = useState(currentSlug);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const dirty = selected !== currentSlug;
  const currentPier = piers.find((p) => p.slug === selected);

  function submit() {
    if (!dirty || pending) return;
    setErr(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await setPierAction(scheduleId, selected);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 2500);
    });
  }

  return (
    <div className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-5 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-red-50)] text-[var(--color-red-600)]">
          <MapPin size={18} />
        </span>
        <div>
          <h2 className="font-display text-lg md:text-xl font-semibold text-[var(--color-charcoal-900)] tracking-tight">
            Píer de embarque
          </h2>
          <p className="text-xs text-[var(--color-charcoal-500)]">
            Altere antes do dia da saída pra clientes verem a info correta.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {piers.map((p) => {
          const isSelected = p.slug === selected;
          return (
            <label
              key={p.slug}
              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${
                isSelected
                  ? 'border-[var(--color-red-600)] bg-[var(--color-red-50)]'
                  : 'border-[var(--color-charcoal-100)] hover:border-[var(--color-charcoal-200)]'
              }`}
            >
              <input
                type="radio"
                name={`pier-${scheduleId}`}
                value={p.slug}
                checked={isSelected}
                onChange={() => setSelected(p.slug)}
                className="mt-1 accent-[var(--color-red-600)]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-sans text-sm font-bold text-[var(--color-charcoal-900)]">
                    {p.name}
                  </p>
                  {p.fee_cents > 0 ? (
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--color-red-700)] bg-white border border-[var(--color-red-200)] px-2 py-0.5 rounded-full">
                      {formatPierFee(p.fee_cents).toLowerCase()}
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--color-success)] bg-white border border-emerald-200 px-2 py-0.5 rounded-full">
                      sem taxa
                    </span>
                  )}
                </div>
                {p.address && (
                  <p className="text-xs text-[var(--color-charcoal-500)] mt-0.5">
                    {p.address}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {dirty && currentPier && currentPier.fee_cents > 0 && (
        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            Esse píer cobra taxa de embarque presencial. Os clientes já reservados receberão um aviso ao acessar a reserva.
          </span>
        </div>
      )}

      {err && (
        <p className="mt-3 text-xs text-[var(--color-red-700)] font-semibold">{err}</p>
      )}
      {success && (
        <p className="mt-3 text-xs text-[var(--color-success)] font-semibold">
          Píer atualizado.
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!dirty || pending}
        className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white font-bold text-sm px-6 py-2.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? 'Salvando…' : dirty ? 'Salvar alteração' : 'Sem alterações'}
      </button>
    </div>
  );
}
