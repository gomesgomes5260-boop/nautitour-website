/**
 * Pagar.me operation mode.
 *
 * - "off"        → checkout disabled for everyone (UI shows "em breve").
 * - "allowlist"  → only emails in PAGARME_ALLOWED_EMAILS can pay. Used for
 *                  building/testing on the live API without exposing the
 *                  checkout to the public.
 * - "live"       → anyone can pay.
 */
export type PagarmeMode = 'off' | 'allowlist' | 'live';

export function getMode(): PagarmeMode {
  const m = process.env.PAGARME_MODE?.toLowerCase();
  if (m === 'allowlist' || m === 'live') return m;
  return 'off';
}

export function getAllowedEmails(): string[] {
  return (process.env.PAGARME_ALLOWED_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Returns true if `email` is permitted to pay under the current mode.
 * - off       → always false.
 * - allowlist → true iff email is on the list.
 * - live      → always true.
 */
export function canPay(email: string | null | undefined): boolean {
  const mode = getMode();
  if (mode === 'off') return false;
  if (mode === 'live') return true;
  if (!email) return false;
  return getAllowedEmails().includes(email.trim().toLowerCase());
}

export function getApiKey(): string {
  const k = process.env.PAGARME_API_KEY;
  if (!k) throw new Error('PAGARME_API_KEY is not set');
  return k;
}

export function getWebhookCredentials(): { user: string; password: string } {
  const user = process.env.PAGARME_WEBHOOK_USER;
  const password = process.env.PAGARME_WEBHOOK_PASSWORD;
  if (!user || !password) {
    throw new Error('PAGARME_WEBHOOK_USER and PAGARME_WEBHOOK_PASSWORD must be set');
  }
  return { user, password };
}

export function getApiUrl(): string {
  return process.env.PAGARME_API_URL ?? 'https://api.pagar.me/core/v5';
}
