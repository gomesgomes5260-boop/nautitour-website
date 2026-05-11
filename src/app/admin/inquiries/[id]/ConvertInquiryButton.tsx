'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { convertInquiryToBookingAction } from '../actions';

export default function ConvertInquiryButton({
  inquiryId,
  defaultDepartureAt,
  defaultPaxNote,
  defaultPriceBRL,
}: {
  inquiryId: string;
  // datetime-local string, sem timezone, ex: "2026-05-15T09:30"
  defaultDepartureAt: string;
  defaultPaxNote: string;
  defaultPriceBRL: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [price, setPrice] = useState(defaultPriceBRL);
  const [departureAt, setDepartureAt] = useState(defaultDepartureAt);

  function submit() {
    setErr(null);
    startTransition(async () => {
      const res = await convertInquiryToBookingAction({
        inquiryId,
        priceBRL: price,
        departureAtISO: departureAt,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      // Redireciona pra reserva admin recém-criada
      router.push(`/admin/reservas/${res.bookingCode}`);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-green-600 text-white text-sm px-4 py-1.5 rounded hover:opacity-90"
      >
        Converter em reserva
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-md max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Converter em reserva</h3>
            <p className="text-sm text-gray-700 mb-3">
              Cria booking <strong>pending_payment</strong> com TTL de 24h.
              Inquiry vai pra status <strong>won</strong>. Você recebe um link
              de pagamento pra mandar pro cliente via WhatsApp.
            </p>
            <p className="text-xs text-gray-600 mb-4">{defaultPaxNote}</p>

            <label className="block text-sm font-medium mb-1">
              Preço total (R$)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="ex: 1200.00"
              className="w-full border border-gray-300 rounded p-2 text-sm font-mono mb-3"
            />

            <label className="block text-sm font-medium mb-1">
              Data e horário de saída (BRT)
            </label>
            <input
              type="datetime-local"
              value={departureAt}
              onChange={(e) => setDepartureAt(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 text-sm font-mono mb-3"
            />

            {err && <p className="text-sm text-red-700 mb-3">{err}</p>}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="text-sm px-4 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending || !price || !departureAt}
                className="bg-green-600 text-white text-sm px-4 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
              >
                {pending ? 'Criando…' : 'Criar reserva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
