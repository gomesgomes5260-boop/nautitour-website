'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { retryPayoutAction } from './actions';

export default function RetryButton({ payoutId }: { payoutId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function retry() {
    setErr(null);
    startTransition(async () => {
      const res = await retryPayoutAction(payoutId);
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
        onClick={retry}
        disabled={pending}
        className="text-xs font-semibold text-[var(--color-red-600)] hover:underline disabled:opacity-50"
      >
        {pending ? 'Enviando…' : 'Reenviar PIX'}
      </button>
      {err && <span className="text-xs text-[var(--color-red-700)]">{err}</span>}
    </span>
  );
}
