'use client';

import { useEffect } from 'react';
import { analytics } from '@/lib/analytics';

// Rastreia TODO clique em CTA de WhatsApp (links pra rota /api/wa) de forma
// centralizada, via listener delegado no document. Cobre links de server E
// client components, atuais e futuros, sem precisar de onClick em cada um —
// vários CTAs (pagamento, lancha, blog, consulta de data) são server components
// e não podiam disparar analytics sozinhos.
//
// Dispara analytics.whatsappClick(source), que faz o evento GA4 `whatsapp_click`
// + a conversão do Google Ads (valor por origem, transporte beacon). Ver
// analytics.ts. A origem sai do parâmetro `s` da URL (?s=fab, ?s=pagamento…).
export default function WhatsAppClickTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      const anchor = target?.closest?.(
        'a[href*="/api/wa"]'
      ) as HTMLAnchorElement | null;
      if (!anchor) return;

      let source = 'unknown';
      try {
        const url = new URL(anchor.href, window.location.origin);
        // `href*="/api/wa"` casa por substring; confirma que é mesmo a rota.
        if (url.pathname !== '/api/wa') return;
        source = url.searchParams.get('s') || 'unknown';
      } catch {
        return;
      }

      analytics.whatsappClick(source);
    }

    // Captura pra rodar antes de qualquer navegação disparada pelo link.
    document.addEventListener('click', onClick, { capture: true });
    return () =>
      document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}
