import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  verifyWebhookBasicAuth,
  type PagarmeWebhookEvent,
} from '@/lib/pagarme/webhook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Pagar.me v5 webhook handler.
 *
 * Flow:
 * 1. Verify HTTP Basic Auth against PAGARME_WEBHOOK_USER/PAGARME_WEBHOOK_PASSWORD.
 *    Reject with 401 on mismatch, before touching the DB.
 * 2. Parse the event and dispatch to the right RPC:
 *    - order.paid / charge.paid    → confirm_booking_payment
 *    - order.payment_failed / charge.payment_failed → mark_booking_payment_failed
 *    - charge.refunded → mark_booking_payment_failed (also cancels booking)
 *    Other event types are acknowledged but ignored.
 * 3. Respond 200 quickly so Pagar.me doesn't retry.
 *
 * Defense in depth:
 * - The RPCs also validate amount (vs bookings.total_cents) and require a
 *   non-empty pagarme_charge_id. The checks below short-circuit before
 *   touching the DB for cleaner error handling.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  let valid = false;
  try {
    valid = verifyWebhookBasicAuth(request.headers.get('authorization'));
  } catch (err) {
    console.error('[pagarme webhook] auth config error', err);
    return NextResponse.json({ error: 'config' }, { status: 500 });
  }
  if (!valid) {
    console.warn('[pagarme webhook] invalid credentials');
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let event: PagarmeWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const bookingId = event.data?.metadata?.booking_id;
  if (!bookingId) {
    return NextResponse.json({ ignored: 'no booking_id in metadata' });
  }

  const charge = event.data?.charges?.[0];
  const orderId = event.data?.id ?? '';
  const amountCents = event.data?.amount ?? 0;
  const paymentMethod = (charge?.payment_method ?? 'pix') as 'pix' | 'credit_card' | 'boleto';

  const isPaidEvent = event.type === 'order.paid' || event.type === 'charge.paid';
  const isFailEvent =
    event.type === 'order.payment_failed' ||
    event.type === 'charge.payment_failed' ||
    event.type === 'charge.refunded';

  if (!isPaidEvent && !isFailEvent) {
    return NextResponse.json({ ignored: event.type });
  }

  // Require a non-empty charge id — both for our idempotency unique index
  // and because the RPCs now reject empty values.
  if (!charge?.id) {
    console.warn('[pagarme webhook] missing charge.id', {
      type: event.type,
      bookingId,
    });
    return NextResponse.json({ ignored: 'missing charge id' });
  }

  const admin = createAdminClient();

  // Pre-load the booking so we can validate amount before issuing the
  // confirm RPC. The RPC also validates, but failing fast here lets us
  // distinguish "amount mismatch" from "Pagar.me transient error" and
  // avoid Pagar.me retrying a known-bad event forever.
  const { data: bk, error: bkError } = await admin
    .from('bookings')
    .select('total_cents')
    .eq('id', bookingId)
    .maybeSingle();
  if (bkError) {
    console.error('[pagarme webhook] booking lookup failed', bkError);
    return NextResponse.json({ error: 'booking lookup failed' }, { status: 500 });
  }
  if (!bk) {
    // Most likely a stale event from another environment. Don't retry.
    return NextResponse.json({ ignored: 'unknown booking' });
  }
  if (isPaidEvent && amountCents !== bk.total_cents) {
    console.error('[pagarme webhook] amount mismatch', {
      bookingId,
      expected: bk.total_cents,
      got: amountCents,
      charge: charge.id,
    });
    return NextResponse.json(
      { error: 'amount mismatch' },
      { status: 422 }
    );
  }

  try {
    if (isPaidEvent) {
      const paidAt = charge.paid_at ?? new Date().toISOString();
      const { data: didSend, error } = await admin.rpc(
        'confirm_booking_payment_v2',
        {
          p_booking_id: bookingId,
          p_pagarme_order_id: orderId,
          p_pagarme_charge_id: charge.id,
          p_payment_method: paymentMethod,
          p_amount_cents: amountCents,
          p_paid_at: paidAt,
          p_raw_response: event.data as never,
        }
      );
      if (error) throw error;
      if (didSend === true) {
        const { sendBookingConfirmationFor } = await import('@/lib/email-flow');
        await sendBookingConfirmationFor(admin, bookingId).catch((e) =>
          console.error('[pagarme webhook] email send failed', e)
        );
      }
    } else {
      const status = event.type === 'charge.refunded' ? 'refunded' : 'failed';
      const { error } = await admin.rpc('mark_booking_payment_failed', {
        p_booking_id: bookingId,
        p_pagarme_order_id: orderId,
        p_pagarme_charge_id: charge.id,
        p_payment_method: paymentMethod,
        p_amount_cents: amountCents,
        p_status: status,
        p_raw_response: event.data as never,
      });
      if (error) throw error;
    }
  } catch (err) {
    console.error('[pagarme webhook] handler error', err);
    return NextResponse.json({ error: 'handler failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
