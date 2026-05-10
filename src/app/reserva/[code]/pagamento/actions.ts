'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { canPay } from '@/lib/pagarme/config';
import { createCreditCardOrder, createPixOrder } from '@/lib/pagarme/client';

export type CreatePixResult =
  | {
      ok: true;
      qrCode: string;
      qrCodeUrl?: string;
      expiresAt?: string;
      pagarmeOrderId: string;
    }
  | { ok: false; error: string };

/**
 * Create a PIX order for an existing pending booking. The server reads the
 * booking from the DB (admin client, since RLS would otherwise block public
 * reads) and re-derives the amount — never trusting the client.
 *
 * Gated by `canPay(customerEmail)` which honours PAGARME_MODE.
 */
export async function createPixForBookingAction(
  bookingCode: string
): Promise<CreatePixResult> {
  const admin = createAdminClient();

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select(
      'id, booking_code, status, total_cents, passenger_count, customer_id, tour_id'
    )
    .eq('booking_code', bookingCode)
    .maybeSingle();

  if (bookingError) return { ok: false, error: bookingError.message };
  if (!booking) return { ok: false, error: 'Reserva não encontrada' };
  if (booking.status !== 'pending_payment') {
    return { ok: false, error: `Reserva já está ${booking.status}` };
  }

  const [{ data: customer }, { data: tour }] = await Promise.all([
    admin
      .from('customers')
      .select('email, full_name, phone, cpf')
      .eq('id', booking.customer_id)
      .maybeSingle(),
    admin.from('tours').select('name').eq('id', booking.tour_id).maybeSingle(),
  ]);

  if (!customer?.email) return { ok: false, error: 'Cliente sem e-mail' };
  if (!tour?.name) return { ok: false, error: 'Tour não encontrado' };

  if (!canPay(customer.email)) {
    return {
      ok: false,
      error:
        'Pagamento online ainda não disponível para este perfil. Entre em contato pelo WhatsApp para finalizar.',
    };
  }

  // Server is the source of truth for amount. Use booking.total_cents,
  // which was set by create_booking_pending based on tour pricing rules.
  try {
    const order = await createPixOrder({
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      amountCents: booking.total_cents,
      description: `${tour.name} — ${booking.booking_code}`,
      customer: {
        name: customer.full_name ?? customer.email,
        email: customer.email,
        phone: customer.phone ?? undefined,
        document: customer.cpf ?? undefined,
      },
      expiresInSeconds: 3600,
    });

    const charge = order.charges?.[0];
    const tx = charge?.last_transaction;
    if (!tx?.qr_code) {
      return { ok: false, error: 'Pagar.me não retornou QR code' };
    }

    return {
      ok: true,
      qrCode: tx.qr_code,
      qrCodeUrl: tx.qr_code_url,
      expiresAt: tx.expires_at,
      pagarmeOrderId: order.id,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha ao gerar PIX';
    return { ok: false, error: msg };
  }
}

export type CreateCardResult =
  | { ok: true; status: 'paid' | 'pending' | 'failed'; bookingCode: string }
  | { ok: false; error: string };

/**
 * Charge an existing pending booking with a tokenized card. Amount comes
 * from booking.total_cents (server-side), never from the client.
 *
 * Card auth is synchronous in Pagar.me: if `status === 'paid'`, we eagerly
 * call confirm_booking_payment so the booking flips before the webhook
 * arrives (the webhook handler is idempotent on pagarme_charge_id, so a
 * later webhook is a no-op).
 */
export async function createCardForBookingAction(input: {
  bookingCode: string;
  cardToken: string;
  cardHolderName: string;
  installments?: number;
}): Promise<CreateCardResult> {
  const admin = createAdminClient();

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select('id, booking_code, status, total_cents, customer_id, tour_id')
    .eq('booking_code', input.bookingCode)
    .maybeSingle();

  if (bookingError) return { ok: false, error: bookingError.message };
  if (!booking) return { ok: false, error: 'Reserva não encontrada' };
  if (booking.status !== 'pending_payment') {
    return { ok: false, error: `Reserva já está ${booking.status}` };
  }

  const [{ data: customer }, { data: tour }] = await Promise.all([
    admin
      .from('customers')
      .select('email, full_name, phone, cpf')
      .eq('id', booking.customer_id)
      .maybeSingle(),
    admin.from('tours').select('name').eq('id', booking.tour_id).maybeSingle(),
  ]);

  if (!customer?.email) return { ok: false, error: 'Cliente sem e-mail' };
  if (!tour?.name) return { ok: false, error: 'Tour não encontrado' };

  if (!canPay(customer.email)) {
    return {
      ok: false,
      error:
        'Pagamento online ainda não disponível para este perfil. Entre em contato pelo WhatsApp para finalizar.',
    };
  }

  try {
    const order = await createCreditCardOrder({
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      amountCents: booking.total_cents,
      description: `${tour.name} — ${booking.booking_code}`,
      cardToken: input.cardToken,
      installments: input.installments ?? 1,
      customer: {
        name: input.cardHolderName.trim() || customer.full_name || customer.email,
        email: customer.email,
        phone: customer.phone ?? undefined,
        document: customer.cpf ?? undefined,
      },
    });

    const charge = order.charges?.[0];
    const status = (order.status ?? '').toLowerCase();

    // Card auth is sync — confirm the booking ourselves on success so the UI
    // doesn't wait for the webhook. The webhook is idempotent on charge_id.
    if (status === 'paid' && charge?.id) {
      const { error: rpcError } = await admin.rpc('confirm_booking_payment', {
        p_booking_id: booking.id,
        p_pagarme_order_id: order.id,
        p_pagarme_charge_id: charge.id,
        p_payment_method: 'credit_card',
        p_amount_cents: order.amount,
        p_paid_at: charge.paid_at ?? new Date().toISOString(),
        p_raw_response: order as never,
      });
      if (rpcError) {
        return { ok: false, error: rpcError.message };
      }
      return { ok: true, status: 'paid', bookingCode: booking.booking_code };
    }

    if (status === 'failed' || status === 'canceled') {
      return { ok: false, error: 'Pagamento recusado pela operadora.' };
    }

    // Some flows (3DS, fraud review) leave the order pending — let the user
    // know we received it and the webhook will finalize it.
    return { ok: true, status: 'pending', bookingCode: booking.booking_code };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha ao processar pagamento';
    return { ok: false, error: msg };
  }
}
