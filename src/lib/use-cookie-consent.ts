'use client';

import { useSyncExternalStore } from 'react';
import {
  CONSENT_EVENT,
  getConsent,
  getConsentOrDefault,
  type ConsentState,
} from './cookie-consent';

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CONSENT_EVENT, callback);
  return () => window.removeEventListener(CONSENT_EVENT, callback);
}

function getSnapshot(): ConsentState | null {
  return getConsent();
}

function getServerSnapshot(): ConsentState | null {
  return null;
}

// Hook reativo que lê o cookie de consent e re-renderiza quando o usuário
// salva preferências em qualquer lugar do app. Usa useSyncExternalStore
// (pattern oficial React pra subscrever a state externo — sem `setState`
// dentro de useEffect, que dispara warnings react-hooks/set-state-in-effect).
//
// Retorna null no SSR (consent só existe no client). Use opcional encadeado:
//   const consent = useCookieConsent();
//   if (consent?.analytics) { ... }
//
// Pra ter um default ao invés de null, use useCookieConsentOrDefault().
export function useCookieConsent(): ConsentState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function getSnapshotOrDefault(): ConsentState {
  return getConsentOrDefault();
}

function getServerSnapshotDefault(): ConsentState {
  return {
    essential: true,
    analytics: false,
    retargeting: false,
    updatedAt: new Date(0).toISOString(),
  };
}

// Mesma coisa mas sempre retorna um ConsentState (default = tudo desativado).
export function useCookieConsentOrDefault(): ConsentState {
  return useSyncExternalStore(
    subscribe,
    getSnapshotOrDefault,
    getServerSnapshotDefault
  );
}
