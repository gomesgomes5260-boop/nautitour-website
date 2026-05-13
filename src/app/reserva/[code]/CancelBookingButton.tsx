'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelOwnBookingAction } from './actions';

export default function CancelBookingButton({
  bookingCode,
  variant = 'card',
  hasPaidPayment,
}: {
  bookingCode: string;
  variant?: 'card' | 'inline';
  hasPaidPayment: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setErr(null);
    startTransition(async () => {
      const res = await cancelOwnBookingAction(bookingCode, reason);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      {variant === 'card' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-white border border-[var(--color-red-100)] text-[var(--color-red-700)] text-sm font-medium px-4 py-2 rounded-full hover:bg-[var(--color-red-50)] hover:border-[var(--color-red-300)] transition-colors"
        >
          Cancelar reserva
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-[var(--color-red-700)] hover:underline"
        >
          Cancelar
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 bg-[var(--color-charcoal-900)]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-[var(--shadow-3)]">
            <h3 className="font-display text-xl font-semibold text-[var(--color-charcoal-900)] mb-2">
              Cancelar esta reserva?
            </h3>
            <p className="text-sm text-[var(--color-charcoal-700)] mb-4">
              Sua reserva será cancelada e a vaga voltará a ficar disponível.
            </p>
            {hasPaidPayment && (
              <div className="bg-[var(--color-red-50)] border border-[var(--color-red-100)] text-[var(--color-red-900)] rounded-xl p-3 text-sm mb-4">
                <strong>Você já pagou esta reserva.</strong> O reembolso será
                processado pela nossa equipe em até <strong>5 dias úteis</strong>{' '}
                no mesmo método de pagamento.
              </div>
            )}
            <p className="text-xs text-[var(--color-charcoal-500)] mb-4">
              Cancelamento só é permitido até <strong>48 horas</strong> antes da
              saída. Mais perto disso, fale com a gente no WhatsApp.
            </p>

            <label className="block text-sm font-medium text-[var(--color-charcoal-700)] mb-1.5">
              Motivo (opcional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Conta brevemente por que está cancelando — ajuda a gente a melhorar"
              className="w-full border border-[var(--color-charcoal-200)] rounded-lg p-2.5 text-sm mb-4 focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors"
            />

            {err && (
              <div className="bg-[var(--color-red-50)] border border-[var(--color-red-100)] text-[var(--color-red-900)] rounded-xl p-3 text-sm mb-4">
                {err}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="text-sm font-medium px-4 py-2 rounded-full border border-[var(--color-charcoal-200)] text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] disabled:opacity-50 transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className="bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-semibold px-5 py-2 rounded-full disabled:opacity-50 transition-colors"
              >
                {pending ? 'Cancelando…' : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
