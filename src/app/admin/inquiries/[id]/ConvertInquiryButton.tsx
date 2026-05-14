'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';
import { convertInquiryToBookingAction } from '../actions';

const inputClass =
  'w-full border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2.5 text-sm text-[var(--color-charcoal-900)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors';

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
        className="w-full bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
      >
        Converter em reserva
      </button>

      <ConfirmModal
        open={open}
        onClose={close}
        onConfirm={submit}
        title="Converter em reserva"
        description={
          <>
            <p>
              Cria booking <strong>pending_payment</strong> com TTL de 24h.
              Inquiry vai pra status <strong>won</strong>. Você recebe um link
              de pagamento pra mandar pro cliente via WhatsApp.
            </p>
            <p className="text-xs text-[var(--color-charcoal-500)] mt-2">
              {defaultPaxNote}
            </p>
          </>
        }
        confirmLabel="Criar reserva"
        cancelLabel="Cancelar"
        pending={pending}
        error={err}
        disableConfirm={!price || !departureAt}
      >
        <label className="block text-sm font-medium text-[var(--color-charcoal-700)] mb-1.5">
          Preço total (R$)
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="ex: 1200.00"
          className={`${inputClass} font-mono mb-4`}
        />

        <label className="block text-sm font-medium text-[var(--color-charcoal-700)] mb-1.5">
          Data e horário de saída (BRT)
        </label>
        <input
          type="datetime-local"
          value={departureAt}
          onChange={(e) => setDepartureAt(e.target.value)}
          className={`${inputClass} font-mono mb-4`}
        />
      </ConfirmModal>
    </>
  );
}
