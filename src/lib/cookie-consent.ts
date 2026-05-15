// Cookie consent helpers (LGPD). Categorias:
//   - essential: sempre true (sessão, CSRF, auth) — não opcional
//   - analytics: GA4, Microsoft Clarity (medição anônima)
//   - retargeting: futuro (Meta Pixel, Google Ads) — reservado
//
// Cookie único `nautitour_consent` com payload JSON.

export type ConsentState = {
  essential: true;
  analytics: boolean;
  retargeting: boolean;
  updatedAt: string;
};

export const CONSENT_COOKIE = 'nautitour_consent';
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180; // 6 meses em segundos
export const CONSENT_EVENT = 'cookie-consent-changed';

const DEFAULT_DECLINED: ConsentState = {
  essential: true,
  analytics: false,
  retargeting: false,
  updatedAt: new Date(0).toISOString(),
};

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const attrs = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAgeSeconds}`,
    'Path=/',
    'SameSite=Lax',
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
  document.cookie = attrs;
}

export function getConsent(): ConsentState | null {
  const raw = readCookie(CONSENT_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    return {
      essential: true,
      analytics: parsed.analytics === true,
      retargeting: parsed.retargeting === true,
      updatedAt: typeof parsed.updatedAt === 'string'
        ? parsed.updatedAt
        : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function setConsent(consent: Omit<ConsentState, 'essential' | 'updatedAt'>): void {
  const state: ConsentState = {
    essential: true,
    analytics: consent.analytics,
    retargeting: consent.retargeting,
    updatedAt: new Date().toISOString(),
  };
  writeCookie(CONSENT_COOKIE, JSON.stringify(state), CONSENT_MAX_AGE);
  // Componentes de tracking escutam esse evento pra carregar/recarregar.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: state })
    );
  }
}

export function acceptAll(): void {
  setConsent({ analytics: true, retargeting: true });
}

export function declineAll(): void {
  setConsent({ analytics: false, retargeting: false });
}

export function hasConsent(
  category: 'analytics' | 'retargeting'
): boolean {
  const consent = getConsent();
  if (!consent) return false;
  return consent[category] === true;
}

export function getConsentOrDefault(): ConsentState {
  return getConsent() ?? DEFAULT_DECLINED;
}
