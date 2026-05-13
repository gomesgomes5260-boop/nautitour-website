'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

// Wrapper thin do Cloudflare Turnstile. Renderiza widget normal
// (managed) e chama `onToken` quando o desafio completa.
//
// Se NEXT_PUBLIC_TURNSTILE_SITE_KEY ausente, vira no-op (chama
// onToken('dev-skip') uma vez pra dev/preview sem captcha configurado).

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'invisible' | 'flexible';
          action?: string;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

type Props = {
  onToken: (token: string | null) => void;
  action?: string;
};

export default function TurnstileWidget({ onToken, action }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Dev/preview sem env: chama onToken('dev-skip') uma vez e termina.
  useEffect(() => {
    if (!siteKey) {
      onToken('dev-skip');
    }
  }, [siteKey, onToken]);

  // Production: monta widget Turnstile.
  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let cancelled = false;

    function tryRender() {
      if (cancelled) return;
      if (!window.turnstile || !containerRef.current) {
        setTimeout(tryRender, 200);
        return;
      }
      if (widgetIdRef.current !== null) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey!,
        callback: (token) => onToken(token),
        'error-callback': () => onToken(null),
        'expired-callback': () => onToken(null),
        theme: 'light',
        // 'flexible' adapta a largura ao container (min 300px, max 100%).
        // Evita overflow do widget em viewports estreitos.
        size: 'flexible',
        action,
      });
    }

    tryRender();

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onToken, action]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
        strategy="afterInteractive"
      />
      <div ref={containerRef} className="my-2 flex justify-center max-w-full" />
    </>
  );
}
