'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function format(ms: number): string {
  if (ms <= 0) return '0:00';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function HoldCountdown({ expiresAt }: { expiresAt: string }) {
  const target = new Date(expiresAt).getTime();
  const [now, setNow] = useState<number>(() => Date.now());
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = target - now;

  useEffect(() => {
    if (remaining <= 0) {
      // The cron will cancel the booking within a minute; refresh so the
      // page picks up the new status.
      router.refresh();
    }
  }, [remaining, router]);

  if (remaining <= 0) {
    return (
      <p className="text-sm mt-2 text-red-700">
        Reserva expirada. Atualizando…
      </p>
    );
  }
  return (
    <p className="text-sm mt-2">
      Tempo restante: <strong>{format(remaining)}</strong>
    </p>
  );
}
