'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { analytics } from '@/lib/analytics';

// Dispara purchase event do GA4 quando o usuário cai na página de reserva
// com `?paid=1` (redirect pós-pagamento). Renderiza nada.
// Idempotente por sessionStorage key — evita duplicar event em F5.
export default function PurchaseTracker({
  bookingCode,
  valueBRL,
}: {
  bookingCode: string;
  valueBRL: number;
}) {
  const params = useSearchParams();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (params?.get('paid') !== '1') return;

    const storageKey = `purchase-tracked-${bookingCode}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, '1');
    } catch {
      // sessionStorage indisponível — segue mesmo assim
    }

    fired.current = true;
    analytics.purchase(bookingCode, valueBRL);
  }, [params, bookingCode, valueBRL]);

  return null;
}
