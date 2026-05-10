import { createHmac, timingSafeEqual } from 'crypto';
import { getWebhookSecret } from './config';

/**
 * Verify a Pagar.me webhook HMAC-SHA256 signature using a constant-time
 * comparison to avoid timing oracles.
 *
 * Pagar.me sends the signature as the raw request body's HMAC, encoded
 * either as hex or base64 depending on the dashboard configuration. We
 * accept both forms.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = getWebhookSecret();
  const expectedHex = createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedB64 = createHmac('sha256', secret).update(rawBody).digest('base64');

  // Normalize: strip leading "sha256=" if present
  const provided = signature.replace(/^sha256=/i, '').trim();

  return safeEqual(provided, expectedHex) || safeEqual(provided, expectedB64);
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
  type: string; // e.g. "order.paid", "charge.paid", "order.payment_failed"
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
