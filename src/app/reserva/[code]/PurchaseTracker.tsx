'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { analytics } from '@/lib/analytics';
import { useCookieConsent } from '@/lib/use-cookie-consent';

// Dispara purchase event do GA4 quando o usuário cai na página de reserva
// com `?paid=1` (redirect pós-pagamento). Renderiza nada.
// Idempotente por sessionStorage key — evita duplicar event em F5.
//
// Enhanced Conversions: passa dados do comprador (email/telefone/nome) pro
// gtag hashear e casar a conversão no Google Ads. Só quando o cliente deu
// consent de retargeting (a categoria "Marketing" do banner LGPD) — sem ele,
// nenhuma PII é enviada.
export default function PurchaseTracker({
  bookingCode,
  valueBRL,
  email,
  phone,
  customerName,
}: {
  bookingCode: string;
  valueBRL: number;
  email?: string | null;
  phone?: string | null;
  customerName?: string | null;
}) {
  const params = useSearchParams();
  const consent = useCookieConsent();
  const fired = useRef(false);
  const canUseEnhanced = consent?.retargeting === true;

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
    analytics.purchase(
      bookingCode,
      valueBRL,
      canUseEnhanced ? { email, phone, name: customerName } : undefined
    );
  }, [params, bookingCode, valueBRL, canUseEnhanced, email, phone, customerName]);

  return null;
}
