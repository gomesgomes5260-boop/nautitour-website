'use client';

import Script from 'next/script';
import { useCookieConsent } from '@/lib/use-cookie-consent';

// Meta Pixel (Facebook/Instagram) — medição de conversão vinda dos anúncios do
// Meta, retargeting de visitantes e lookalikes. Espelha o GoogleAdsTag: só
// carrega com NEXT_PUBLIC_META_PIXEL_ID configurado E consent da categoria
// "retargeting" (a de Marketing do banner). Os eventos de conversão
// (Lead/Purchase) disparam via analytics.ts, ao lado das conversões do Google.
// No-op sem o env — pode ir pra produção antes do Pixel ID existir.
export default function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const consent = useCookieConsent();

  if (!pixelId) return null;
  if (!consent?.retargeting) return null;

  return (
    <Script id="meta-pixel-init" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `}
    </Script>
  );
}
