'use client';

import { useState, useTransition } from 'react';
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
        className="bg-[rgb(9,110,171)] text-white text-sm px-4 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Enviando…' : 'Reenviar e-mail de confirmação'}
      </button>
      {msg && (
        <span
          className={`text-sm ${tone === 'ok' ? 'text-green-700' : 'text-red-700'}`}
        >
          {msg}
        </span>
      )}
    </div>
  );
}
