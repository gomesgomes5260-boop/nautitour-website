'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markPayoutPaidAction } from './actions';

export default function MarkPaidButton({
  payoutId,
  sellerName,
  amountLabel,
}: {
  payoutId: string;
  sellerName: string;
  amountLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function markPaid() {
    if (
      !confirm(
        `Confirmar que a comissão de ${amountLabel} de ${sellerName} já foi paga (PIX/transferência feita por fora)?`
      )
    ) {
      return;
    }
    setErr(null);
    startTransition(async () => {
      const res = await markPayoutPaidAction(payoutId);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={markPaid}
        disabled={pending}
        className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50"
      >
        {pending ? 'Salvando…' : 'Marcar como pago'}
      </button>
      {err && <span className="text-xs text-[var(--color-red-700)]">{err}</span>}
    </span>
  );
}
