'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
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
  const confirmOk =
    !requiresExtraConfirm || confirm.trim().toUpperCase() === expectedWord;

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

  function close() {
    if (pending) return;
    setOpen(false);
    setConfirm('');
    setErr(null);
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

      <ConfirmModal
        open={open}
        onClose={close}
        onConfirm={submit}
        title="Deletar saída?"
        description={
          <p>
            Esta ação é <strong>irreversível</strong>. A saída some do banco e
            não pode ser recuperada.
          </p>
        }
        confirmLabel="Deletar saída"
        cancelLabel="Cancelar"
        pending={pending}
        error={err}
        disableConfirm={!confirmOk}
      >
        {requiresExtraConfirm && (
          <>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-4">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold mb-1">
                  {activeBookings} booking{activeBookings === 1 ? '' : 's'}{' '}
                  ativa{activeBookings === 1 ? '' : 's'} será
                  {activeBookings === 1 ? '' : 'ão'} CANCELADAS.
                </p>
                <p>
                  Você precisa processar o reembolso manualmente no painel
                  Pagar.me. Avise os clientes antes de deletar.
                </p>
              </div>
            </div>
            <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-charcoal-500)] mb-1">
              Digite{' '}
              <code className="bg-[var(--color-charcoal-50)] px-1 py-0.5 rounded">
                {expectedWord}
              </code>{' '}
              pra confirmar
            </label>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-charcoal-200)] rounded-md font-mono text-sm mb-4 focus:outline-none focus:border-[var(--color-red-600)]"
              placeholder={expectedWord}
            />
          </>
        )}
      </ConfirmModal>
    </>
  );
}
