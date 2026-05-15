'use client';

import Script from 'next/script';
import { useCookieConsent } from '@/lib/use-cookie-consent';

// Carrega GA4 só se NEXT_PUBLIC_GA_ID estiver configurado E o usuário deu
// consent pra cookies analíticos (LGPD). No-op silencioso caso contrário.
//
// useCookieConsent reage dinamicamente — se o usuário aceitar depois (via
// banner ou /cookie-preferences), GA4 carrega sem refresh.
export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const consent = useCookieConsent();

  if (!gaId) return null;
  if (!consent?.analytics) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            anonymize_ip: true,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}
