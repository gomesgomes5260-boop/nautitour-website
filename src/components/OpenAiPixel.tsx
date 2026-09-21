'use client';

import Script from 'next/script';
import { useCookieConsent } from '@/lib/use-cookie-consent';

// Pixel de anúncios da OpenAI (ChatGPT Ads) — medição de conversão vinda de
// anúncios no ChatGPT. Espelha o MetaPixel: só carrega com
// NEXT_PUBLIC_OPENAI_PIXEL_ID configurado E consent da categoria
// "retargeting" (a de Marketing do banner). Diferente do Meta, o SDK NÃO
// auto-rastreia pageview — os eventos (lead_created/order_created) disparam
// via analytics.ts. O SDK captura o parâmetro de clique ?oppref= da landing
// e o guarda em cookie 1st-party pra atribuição posterior.
// No-op sem o env — pode ir pra produção antes do Pixel ID existir.
export default function OpenAiPixel() {
  const pixelId = process.env.NEXT_PUBLIC_OPENAI_PIXEL_ID;
  const consent = useCookieConsent();

  if (!pixelId) return null;
  if (!consent?.retargeting) return null;

  return (
    <Script id="openai-pixel-init" strategy="afterInteractive">
      {`
        (function (w, d, s, u) {
          if (w.oaiq) return;
          var q = function () { q.q.push(arguments); };
          q.q = []; w.oaiq = q;
          var js = d.createElement(s); js.async = true; js.src = u;
          var f = d.getElementsByTagName(s)[0]; f.parentNode.insertBefore(js, f);
        })(window, document, "script", "https://bzrcdn.openai.com/sdk/oaiq.min.js");
        oaiq("init", { pixelId: "${pixelId}" });
      `}
    </Script>
  );
}
