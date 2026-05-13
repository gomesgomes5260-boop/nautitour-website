'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { createTourScheduleAction } from '@/app/admin/config/actions';

type TourOpt = {
  id: string;
  name: string;
  slug: string;
  tour_type: string;
  base_price_cents: number | null;
};

type PierOpt = { slug: string; name: string; fee_cents: number };

type Props = {
  tours: TourOpt[];
  piers: PierOpt[];
};

function parsePrice(value: string): number | null | 'invalid' {
  const t = value.trim();
  if (!t) return null;
  const clean = t.replace(/\./g, '').replace(',', '.');
  const n = Number(clean);
  if (!Number.isFinite(n) || n < 0) return 'invalid';
  return Math.round(n * 100);
}

export default function CreateScheduleButton({ tours, piers }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [tourId, setTourId] = useState(tours[0]?.id ?? '');
  const [departureAt, setDepartureAt] = useState('');
  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState('');
  const [pierSlug, setPierSlug] = useState<string>(piers.find((p) => p.fee_cents === 0)?.slug ?? piers[0]?.slug ?? '');

  function submit() {
    setErr(null);
    if (!tourId) {
      setErr('Selecione o tour');
      return;
    }
    if (!departureAt) {
      setErr('Informe data e hora');
      return;
    }
    const cap = Number(capacity);
    if (!Number.isInteger(cap) || cap <= 0) {
      setErr('Capacidade inválida');
      return;
    }
    const parsedPrice = parsePrice(price);
    if (parsedPrice === 'invalid') {
      setErr('Preço inválido');
      return;
    }
    startTransition(async () => {
      const res = await createTourScheduleAction({
        tourId,
        departureAtBRT: departureAt,
        capacity: cap,
        priceCents: parsedPrice === null ? null : parsedPrice,
        pierSlug: pierSlug || null,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOpen(false);
      setDepartureAt('');
      setCapacity('');
      setPrice('');
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={tours.length === 0}
        className="inline-flex items-center gap-2 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-bold px-4 py-2 rounded-full disabled:opacity-40"
      >
        <Plus size={14} />
        Nova saída avulsa
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-display text-lg font-semibold mb-1">Nova saída avulsa</h3>
            <p className="text-xs text-gray-600 mb-5">
              Cria uma saída em data específica (sem depender de template). Útil pra feriados, eventos ou saídas privativas.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.08em] text-gray-600 mb-1">Tour</label>
                <select
                  value={tourId}
                  onChange={(e) => setTourId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {tours.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.08em] text-gray-600 mb-1">Data e hora (BRT)</label>
                <input
                  type="datetime-local"
                  value={departureAt}
                  onChange={(e) => setDepartureAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.08em] text-gray-600 mb-1">Capacidade</label>
                  <input
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.08em] text-gray-600 mb-1">Preço (R$)</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="vazio = padrão do tour"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.08em] text-gray-600 mb-1">Píer de embarque</label>
                <select
                  value={pierSlug}
                  onChange={(e) => setPierSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {piers.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}{p.fee_cents > 0 ? ` (taxa R$ ${(p.fee_cents / 100).toFixed(2).replace('.', ',')})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {err && <p className="mt-3 text-xs text-red-700 font-semibold">{err}</p>}

            <div className="flex gap-3 justify-end mt-5">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setErr(null);
                }}
                disabled={pending}
                className="text-sm px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className="inline-flex items-center gap-1.5 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-bold px-5 py-2 rounded-full disabled:opacity-40"
              >
                {pending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Criar saída
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
