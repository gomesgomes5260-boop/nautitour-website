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
          className="bg-white border border-red-300 text-red-700 text-sm px-4 py-1.5 rounded hover:bg-red-50"
        >
          Cancelar reserva
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-red-700 hover:underline"
        >
          Cancelar
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-md max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Cancelar esta reserva?</h3>
            <p className="text-sm text-gray-700 mb-3">
              Sua reserva será cancelada e a vaga voltará a ficar disponível.
            </p>
            {hasPaidPayment && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded p-3 text-sm mb-3">
                <strong>Você já pagou esta reserva.</strong> O reembolso será
                processado pela nossa equipe em até <strong>5 dias úteis</strong>{' '}
                no mesmo método de pagamento.
              </div>
            )}
            <p className="text-xs text-gray-500 mb-3">
              Cancelamento só é permitido até <strong>48 horas</strong> antes da
              saída. Mais perto disso, fale com a gente no WhatsApp.
            </p>

            <label className="block text-sm font-medium mb-1">
              Motivo (opcional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Conta brevemente por que está cancelando — ajuda a gente a melhorar"
              className="w-full border border-gray-300 rounded p-2 text-sm mb-3"
            />

            {err && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3 text-sm mb-3">
                {err}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="text-sm px-4 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className="bg-red-600 text-white text-sm px-4 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
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
