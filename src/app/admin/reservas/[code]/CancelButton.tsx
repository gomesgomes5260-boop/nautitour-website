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
        className="bg-red-600 text-white text-sm px-4 py-1.5 rounded hover:opacity-90"
      >
        Cancelar reserva
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-md max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Cancelar reserva?</h3>
            <p className="text-sm text-gray-700 mb-3">
              A reserva será marcada como <strong>cancelada</strong> e a vaga
              voltará pra venda.
            </p>
            {isPaid && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded p-3 text-sm mb-3">
                Reserva está paga. <strong>O reembolso não é automático</strong>
                . Você pode tentar reembolso automático pelo botão dedicado
                depois de cancelar, ou processar manualmente no Pagar.me.
              </div>
            )}
            <label className="block text-sm font-medium mb-1">
              Motivo (registrado no histórico)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full border border-gray-300 rounded p-2 text-sm mb-3"
              placeholder="Ex: cliente solicitou, falha técnica, problema de saúde"
            />
            {err && <p className="text-sm text-red-700 mb-3">{err}</p>}
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
                disabled={pending || reason.trim().length < 3}
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
