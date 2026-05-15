'use client';

import Script from 'next/script';
import { useCookieConsent } from '@/lib/use-cookie-consent';

// Microsoft Clarity — heatmap + session recording free. No-op silencioso
// se NEXT_PUBLIC_CLARITY_ID ausente OU se o usuário não deu consent pra
// cookies analíticos (LGPD).
//
// Clarity respeita `Do Not Track` automaticamente no client side.
// Mascaramento de PII é configurado no dashboard Clarity (modo "Mask"
// por default em campos sensíveis).
export default function MicrosoftClarity() {
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
  const consent = useCookieConsent();

  if (!clarityId) return null;
  if (!consent?.analytics) return null;

  return (
    <Script id="ms-clarity-init" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${clarityId}");
      `}
    </Script>
  );
}
