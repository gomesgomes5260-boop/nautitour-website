import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  verifyWebhookSignature,
  type PagarmeWebhookEvent,
} from '@/lib/pagarme/webhook';

// Force Node.js runtime — we use Node's `crypto` module for HMAC.
export const runtime = 'nodejs';
// Don't cache; every request is unique.
export const dynamic = 'force-dynamic';

/**
 * Pagar.me v5 webhook handler.
 *
 * Flow:
 * 1. Read raw body (signature is computed over the byte-exact body).
 * 2. Verify HMAC-SHA256 signature against PAGARME_WEBHOOK_SECRET.
 *    Reject with 401 on mismatch, before touching the DB.
 * 3. Parse the event and dispatch to the right RPC:
 *    - order.paid / charge.paid    → confirm_booking_payment
 *    - order.payment_failed / charge.payment_failed → mark_booking_payment_failed
 *    Other event types are acknowledged but ignored.
 * 4. Respond 200 quickly so Pagar.me doesn't retry.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  // Pagar.me sends the signature in `X-Hub-Signature` (legacy) or
  // `x-pagar-signature` depending on configuration; accept both.
  const signature =
    request.headers.get('x-hub-signature') ??
    request.headers.get('x-pagar-signature') ??
    request.headers.get('x-signature');

  let valid = false;
  try {
    valid = verifyWebhookSignature(rawBody, signature);
  } catch (err) {
    console.error('[pagarme webhook] signature config error', err);
    return NextResponse.json({ error: 'config' }, { status: 500 });
  }
  if (!valid) {
    console.warn('[pagarme webhook] invalid signature');
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let event: PagarmeWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const bookingId = event.data?.metadata?.booking_id;
  if (!bookingId) {
    // Not one of ours, but Pagar.me retries non-2xx. Acknowledge and ignore.
    return NextResponse.json({ ignored: 'no booking_id in metadata' });
  }

  const admin = createAdminClient();
  const charge = event.data?.charges?.[0];
  const orderId = event.data?.id ?? '';
  const amountCents = event.data?.amount ?? 0;
  const paymentMethod = (charge?.payment_method ?? 'pix') as 'pix' | 'credit_card' | 'boleto';

  try {
    switch (event.type) {
      case 'order.paid':
      case 'charge.paid': {
        const paidAt = charge?.paid_at ?? new Date().toISOString();
        const { error } = await admin.rpc('confirm_booking_payment', {
          p_booking_id: bookingId,
          p_pagarme_order_id: orderId,
          p_pagarme_charge_id: charge?.id ?? '',
          p_payment_method: paymentMethod,
          p_amount_cents: amountCents,
          p_paid_at: paidAt,
          p_raw_response: event.data as never,
        });
        if (error) throw error;
        break;
      }
      case 'order.payment_failed':
      case 'charge.payment_failed':
      case 'charge.refunded': {
        const status = event.type.endsWith('refunded') ? 'refunded' : 'failed';
        const { error } = await admin.rpc('mark_booking_payment_failed', {
          p_booking_id: bookingId,
          p_pagarme_order_id: orderId,
          p_pagarme_charge_id: charge?.id ?? '',
          p_payment_method: paymentMethod,
          p_amount_cents: amountCents,
          p_status: status,
          p_raw_response: event.data as never,
        });
        if (error) throw error;
        break;
      }
      default:
        // Acknowledge other events without acting on them.
        return NextResponse.json({ ignored: event.type });
    }
  } catch (err) {
    console.error('[pagarme webhook] handler error', err);
    // Return 500 so Pagar.me retries with backoff
    return NextResponse.json({ error: 'handler failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
