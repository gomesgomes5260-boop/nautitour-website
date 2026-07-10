'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { checkInBookingAction } from '../../scan/actions';

export default function CheckInButton({ bookingCode }: { bookingCode: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function checkIn() {
    if (!confirm(`Confirmar embarque da reserva ${bookingCode}?`)) return;
    setErr(null);
    startTransition(async () => {
      const res = await checkInBookingAction(bookingCode);
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
        onClick={checkIn}
        disabled={pending}
        className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50 print:hidden"
      >
        {pending ? 'Confirmando…' : 'Embarcar'}
      </button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </span>
  );
}
