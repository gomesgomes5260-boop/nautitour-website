import { timingSafeEqual } from 'crypto';
import { getWebhookCredentials } from './config';

/**
 * Verify a Pagar.me webhook HTTP Basic Auth header using a constant-time
 * comparison to avoid timing oracles.
 *
 * Pagar.me v5 webhooks authenticate via Basic Auth: the user/password
 * configured in the dashboard are sent in the standard
 * `Authorization: Basic base64(user:password)` header.
 */
export function verifyWebhookBasicAuth(authHeader: string | null): boolean {
  if (!authHeader) return false;
  const match = /^Basic\s+(.+)$/i.exec(authHeader.trim());
  if (!match) return false;

  let decoded: string;
  try {
    decoded = Buffer.from(match[1], 'base64').toString('utf8');
  } catch {
    return false;
  }
  const sep = decoded.indexOf(':');
  if (sep < 0) return false;
  const providedUser = decoded.slice(0, sep);
  const providedPassword = decoded.slice(sep + 1);

  const { user, password } = getWebhookCredentials();
  return safeEqual(providedUser, user) && safeEqual(providedPassword, password);
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * Pagar.me webhook event payload shape (subset we care about).
 * Full schema: https://docs.pagar.me/reference/webhooks
 */
export type PagarmeWebhookEvent = {
  id: string;
  type: string;
  data: {
    id?: string;
    code?: string;
    status?: string;
    amount?: number;
    metadata?: Record<string, string>;
    charges?: Array<{
      id: string;
      status: string;
      payment_method: string;
      paid_at?: string | null;
    }>;
  };
};
