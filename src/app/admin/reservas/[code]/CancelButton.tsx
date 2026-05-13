'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelBookingAction } from './actions';

export default function CancelButton({
  bookingCode,
  isPaid,
}: {
  bookingCode: string;
  isPaid: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    setErr(null);
    startTransition(async () => {
      const res = await cancelBookingAction(bookingCode, reason);
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
      >
        Cancelar reserva
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-[var(--color-charcoal-900)]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-[var(--shadow-3)]">
            <h3 className="font-display text-xl font-semibold text-[var(--color-charcoal-900)] mb-2">
              Cancelar reserva?
            </h3>
            <p className="text-sm text-[var(--color-charcoal-700)] mb-4">
              A reserva será marcada como <strong>cancelada</strong> e a vaga
              voltará pra venda.
            </p>
            {isPaid && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-sm mb-4">
                Reserva está paga. <strong>O reembolso não é automático.</strong>{' '}
                Você pode tentar reembolso automático pelo botão dedicado depois
                de cancelar, ou processar manualmente no Pagar.me.
              </div>
            )}
            <label className="block text-sm font-medium text-[var(--color-charcoal-700)] mb-1.5">
              Motivo (registrado no histórico)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full border border-[var(--color-charcoal-200)] rounded-lg p-2.5 text-sm mb-4 focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors"
              placeholder="Ex: cliente solicitou, falha técnica, problema de saúde"
            />
            {err && (
              <div className="rounded-xl bg-[var(--color-red-50)] border border-[var(--color-red-100)] text-[var(--color-red-900)] p-3 text-sm mb-4">
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
                disabled={pending || reason.trim().length < 3}
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
