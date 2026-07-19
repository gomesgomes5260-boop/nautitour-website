'use client';

import Script from 'next/script';
import { useCookieConsent } from '@/lib/use-cookie-consent';

// Tag do Google Ads (AW-…) pra conversion tracking e remarketing. Só carrega
// com NEXT_PUBLIC_GOOGLE_ADS_ID configurado E consent da categoria
// "retargeting" (a de Marketing do banner — reservada pra isso desde o PR #66).
// Independente do GA4: cada tag carrega o próprio gtag.js (o loader é o mesmo
// script; dois <script> com ids diferentes são deduplicados pelo Google) e o
// dataLayer é compartilhado — analytics.ts enxerga os dois configs.
export default function GoogleAdsTag() {
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const consent = useCookieConsent();

  if (!adsId) return null;
  if (!consent?.retargeting) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${adsId}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${adsId}');
        `}
      </Script>
    </>
  );
}
