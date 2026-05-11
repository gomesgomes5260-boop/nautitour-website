'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { attemptRefundAction } from './actions';

export default function RefundButton({ bookingCode }: { bookingCode: string }) {
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    setErr(null);
    setOk(false);
    startTransition(async () => {
      const res = await attemptRefundAction(bookingCode);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOk(true);
      setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 1200);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-amber-600 text-white text-sm px-4 py-1.5 rounded hover:opacity-90"
      >
        Tentar reembolso automático
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-md max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">
              Reembolsar via Pagar.me?
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              Vamos chamar a API do Pagar.me para devolver o valor integral ao
              cliente. <strong>Reembolso parcial só pelo painel deles.</strong>
            </p>
            {err && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3 text-sm mb-3">
                {err}
              </div>
            )}
            {ok && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded p-3 text-sm mb-3">
                Reembolso registrado com sucesso.
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="text-sm px-4 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
              >
                Fechar
              </button>
              {!ok && (
                <button
                  type="button"
                  onClick={submit}
                  disabled={pending}
                  className="bg-amber-600 text-white text-sm px-4 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
                >
                  {pending ? 'Processando…' : 'Confirmar reembolso'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
