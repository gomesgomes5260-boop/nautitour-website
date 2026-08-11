'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Paperclip, FileCheck2 } from 'lucide-react';
import { uploadPayoutReceiptAction, getReceiptUrlAction } from './actions';

/**
 * Comprovante do pagamento da comissão: anexa (foto/PDF, bucket privado)
 * e abre via URL assinada. 1 comprovante por payout — reanexar substitui.
 */
export default function ReceiptButton({
  payoutId,
  hasReceipt,
}: {
  payoutId: string;
  hasReceipt: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onPick(file: File | null) {
    if (!file) return;
    setErr(null);
    const fd = new FormData();
    fd.set('payoutId', payoutId);
    fd.set('file', file);
    startTransition(async () => {
      const res = await uploadPayoutReceiptAction(fd);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });
  }

  function openReceipt() {
    setErr(null);
    startTransition(async () => {
      const res = await getReceiptUrlAction(payoutId);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      window.open(res.url, '_blank', 'noopener');
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      {err && <span className="text-[11px] text-[var(--color-red-700)]">{err}</span>}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
      {hasReceipt ? (
        <>
          <button
            type="button"
            onClick={openReceipt}
            disabled={pending}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50"
          >
            <FileCheck2 size={13} />
            Ver comprovante
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={pending}
            className="text-[11px] text-[var(--color-charcoal-500)] hover:underline disabled:opacity-50"
          >
            trocar
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={pending}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-charcoal-700)] hover:underline disabled:opacity-50"
        >
          <Paperclip size={13} />
          {pending ? 'Enviando…' : 'Anexar comprovante'}
        </button>
      )}
    </span>
  );
}
