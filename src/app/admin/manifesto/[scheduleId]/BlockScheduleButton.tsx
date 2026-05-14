'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';
import { blockScheduleAction } from '@/app/admin/config/actions';

export default function BlockScheduleButton({
  scheduleId,
  confirmedBookings,
}: {
  scheduleId: string;
  confirmedBookings: number;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    setErr(null);
    startTransition(async () => {
      const res = await blockScheduleAction(scheduleId, reason);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function close() {
    if (pending) return;
    setOpen(false);
    setReason('');
    setErr(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
      >
        Bloquear saída
      </button>

      <ConfirmModal
        open={open}
        onClose={close}
        onConfirm={submit}
        title="Bloquear esta saída?"
        description={
          <>
            <p>
              A saída será marcada como <strong>cancelada</strong> e some das
              listas públicas.
            </p>
            {confirmedBookings > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-sm mt-3">
                <strong>{confirmedBookings}</strong> reserva
                {confirmedBookings === 1 ? '' : 's'} confirmada
                {confirmedBookings === 1 ? '' : 's'} será
                {confirmedBookings === 1 ? '' : 'ão'} canceladas. Você precisará
                processar o reembolso manualmente no painel Pagar.me.
              </div>
            )}
          </>
        }
        confirmLabel="Confirmar bloqueio"
        cancelLabel="Cancelar"
        pending={pending}
        error={err}
        disableConfirm={reason.trim().length < 3}
      >
        <label className="block text-sm font-medium text-[var(--color-charcoal-700)] mb-1.5">
          Motivo (será registrado nas reservas)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={300}
          className="w-full border border-[var(--color-charcoal-200)] rounded-lg p-2.5 text-sm mb-4 focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors"
          placeholder="Ex: mar agitado, manutenção emergencial, feriado"
        />
      </ConfirmModal>
    </>
  );
}
