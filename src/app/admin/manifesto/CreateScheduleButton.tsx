'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
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

const fieldLabel =
  'block text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-charcoal-500)] mb-1';
const fieldInput =
  'w-full px-3 py-2 border border-[var(--color-charcoal-200)] rounded-md text-sm font-mono focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)]';

export default function CreateScheduleButton({ tours, piers }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [tourId, setTourId] = useState(tours[0]?.id ?? '');
  const [departureAt, setDepartureAt] = useState('');
  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState('');
  const [pierSlug, setPierSlug] = useState<string>(
    piers.find((p) => p.fee_cents === 0)?.slug ?? piers[0]?.slug ?? ''
  );

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

  function close() {
    if (pending) return;
    setOpen(false);
    setErr(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={tours.length === 0}
        className="inline-flex items-center gap-2 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-bold px-4 py-2 rounded-full disabled:opacity-40 transition-colors"
      >
        <Plus size={14} />
        Nova saída avulsa
      </button>

      <ConfirmModal
        open={open}
        onClose={close}
        onConfirm={submit}
        title="Nova saída avulsa"
        description="Cria uma saída em data específica (sem depender de template). Útil pra feriados, eventos ou saídas privativas."
        confirmLabel="Criar saída"
        cancelLabel="Cancelar"
        pending={pending}
        error={err}
      >
        <div className="space-y-3 mb-4">
          <div>
            <label className={fieldLabel}>Tour</label>
            <select
              value={tourId}
              onChange={(e) => setTourId(e.target.value)}
              className={fieldInput.replace(' font-mono', '')}
            >
              {tours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={fieldLabel}>Data e hora (BRT)</label>
            <input
              type="datetime-local"
              value={departureAt}
              onChange={(e) => setDepartureAt(e.target.value)}
              className={fieldInput}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={fieldLabel}>Capacidade</label>
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="120"
                className={fieldInput}
              />
            </div>
            <div>
              <label className={fieldLabel}>Preço (R$)</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="vazio = padrão"
                className={fieldInput}
              />
            </div>
          </div>

          <div>
            <label className={fieldLabel}>Píer de embarque</label>
            <select
              value={pierSlug}
              onChange={(e) => setPierSlug(e.target.value)}
              className={fieldInput.replace(' font-mono', '')}
            >
              {piers.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                  {p.fee_cents > 0
                    ? ` (taxa R$ ${(p.fee_cents / 100).toFixed(2).replace('.', ',')})`
                    : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ConfirmModal>
    </>
  );
}
