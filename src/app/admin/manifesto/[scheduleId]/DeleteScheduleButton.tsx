'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle } from 'lucide-react';
import { deleteScheduleAction } from './actions';

export default function DeleteScheduleButton({
  scheduleId,
  activeBookings,
}: {
  scheduleId: string;
  activeBookings: number;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const requiresExtraConfirm = activeBookings > 0;
  const expectedWord = 'DELETAR';
  const confirmOk = !requiresExtraConfirm || confirm.trim().toUpperCase() === expectedWord;

  function submit() {
    if (!confirmOk) return;
    setErr(null);
    startTransition(async () => {
      const res = await deleteScheduleAction(scheduleId, requiresExtraConfirm);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.push('/admin/manifesto');
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-white border border-[var(--color-red-200)] text-[var(--color-red-700)] hover:bg-[var(--color-red-50)] text-sm font-semibold px-4 py-1.5 rounded"
      >
        <Trash2 size={14} />
        Deletar saída
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-red-50)] text-[var(--color-red-600)] shrink-0">
                <Trash2 size={18} />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)]">
                  Deletar saída?
                </h3>
                <p className="text-sm text-[var(--color-charcoal-500)]">
                  Esta ação é <strong>irreversível</strong>. A saída some do
                  banco e não pode ser recuperada.
                </p>
              </div>
            </div>

            {requiresExtraConfirm && (
              <>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-4">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">
                      {activeBookings} booking(s) ativa(s) serão CANCELADAS.
                    </p>
                    <p>
                      Você precisa processar o reembolso manualmente no painel
                      Pagar.me. Avise os clientes antes de deletar.
                    </p>
                  </div>
                </div>
                <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-charcoal-500)] mb-1">
                  Digite <code className="bg-[var(--color-charcoal-50)] px-1 py-0.5 rounded">{expectedWord}</code> pra confirmar
                </label>
                <input
                  type="text"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-charcoal-200)] rounded-md font-mono text-sm mb-3 focus:outline-none focus:border-[var(--color-red-600)]"
                  placeholder={expectedWord}
                />
              </>
            )}

            {err && <p className="text-xs text-[var(--color-red-700)] font-semibold mb-3">{err}</p>}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setConfirm('');
                  setErr(null);
                }}
                disabled={pending}
                className="text-sm px-4 py-2 rounded-full border border-[var(--color-charcoal-200)] hover:bg-[var(--color-charcoal-50)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!confirmOk || pending}
                className="bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-bold px-5 py-2 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pending ? 'Deletando…' : 'Deletar saída'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
