'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateTourPricingAction } from './actions';

export type TourRow = {
  id: string;
  name: string;
  slug: string;
  base_price_cents: number | null;
  max_capacity: number | null;
};

export default function TourPricingForm({ tour }: { tour: TourRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const initialPriceBRL = tour.base_price_cents != null
    ? (tour.base_price_cents / 100).toFixed(2)
    : '';
  const [priceBRL, setPriceBRL] = useState(initialPriceBRL);
  const [capacity, setCapacity] = useState(
    tour.max_capacity != null ? String(tour.max_capacity) : ''
  );
  const [applyToFuture, setApplyToFuture] = useState(false);

  function save() {
    setErr(null);
    setOk(null);
    const parsedPrice = priceBRL.trim() ? Math.round(parseFloat(priceBRL.replace(',', '.')) * 100) : null;
    const parsedCap = capacity.trim() ? parseInt(capacity, 10) : null;

    if (parsedPrice != null && (!Number.isFinite(parsedPrice) || parsedPrice < 100)) {
      setErr('Preço inválido (mínimo R$ 1,00)');
      return;
    }
    if (parsedCap != null && (!Number.isFinite(parsedCap) || parsedCap < 1)) {
      setErr('Capacidade inválida');
      return;
    }

    startTransition(async () => {
      const res = await updateTourPricingAction({
        tourId: tour.id,
        basePriceCents: parsedPrice,
        maxCapacity: parsedCap,
        applyToFutureSchedules: applyToFuture,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOk(
        applyToFuture
          ? `Salvo. ${res.schedulesUpdated} saídas futuras atualizadas.`
          : 'Salvo. Saídas futuras já criadas mantêm os valores anteriores.'
      );
      setApplyToFuture(false);
      router.refresh();
    });
  }

  return (
    <div className="border border-gray-200 rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{tour.name}</h3>
        <code className="text-xs text-gray-500">{tour.slug}</code>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Preço base (R$)</label>
          <input
            type="text"
            inputMode="decimal"
            value={priceBRL}
            onChange={(e) => setPriceBRL(e.target.value)}
            placeholder="ex: 60.00"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Capacidade máxima</label>
          <input
            type="number"
            min={1}
            max={500}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="ex: 60"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
          />
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={applyToFuture}
          onChange={(e) => setApplyToFuture(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          <strong>Aplicar às saídas futuras já criadas</strong>{' '}
          <span className="text-gray-600">
            (recalcula <code>price_cents</code> e <code>capacity</code> dos <em>tour_schedules</em>{' '}
            com <code>departure_at &gt; agora</code>; ignora saídas já com pax acima da nova capacidade)
          </span>
        </span>
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="bg-[rgb(9,110,171)] text-white text-sm px-4 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Salvando…' : 'Salvar'}
        </button>
        {err && <span className="text-sm text-red-700">{err}</span>}
        {ok && <span className="text-sm text-green-700">{ok}</span>}
      </div>
    </div>
  );
}
