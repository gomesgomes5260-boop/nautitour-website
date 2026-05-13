'use client';

import { useState, useTransition } from 'react';
import { Mail } from 'lucide-react';
import { resendConfirmationEmailAction } from './actions';

export default function ResendEmailButton({ bookingCode }: { bookingCode: string }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [tone, setTone] = useState<'ok' | 'err' | null>(null);

  function onClick() {
    setMsg(null);
    setTone(null);
    startTransition(async () => {
      const res = await resendConfirmationEmailAction(bookingCode);
      if (res.ok) {
        setTone('ok');
        setMsg('E-mail reenviado.');
      } else {
        setTone('err');
        setMsg(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center justify-center gap-1.5 bg-white border border-[var(--color-charcoal-200)] text-[var(--color-charcoal-700)] text-sm font-medium px-4 py-2 rounded-full hover:bg-[var(--color-charcoal-50)] hover:border-[var(--color-charcoal-300)] disabled:opacity-50 transition-colors"
      >
        <Mail size={14} />
        {pending ? 'Enviando…' : 'Reenviar e-mail de confirmação'}
      </button>
      {msg && (
        <span
          className={`text-xs ${
            tone === 'ok'
              ? 'text-emerald-700'
              : 'text-[var(--color-red-700)]'
          }`}
        >
          {msg}
        </span>
      )}
    </div>
  );
}
