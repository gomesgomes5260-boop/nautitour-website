'use server';

import { cookies, headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { canPay } from '@/lib/pagarme/config';
import { createCreditCardOrder, createPixOrder } from '@/lib/pagarme/client';
import { cookieNameFor, verifyBookingCode } from '@/lib/booking-session';
import { paymentLimiter, getClientIp } from '@/lib/rate-limit';

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
 * Authorize a payment action against a booking.
 *
 * Returns ok if EITHER:
 *   (a) the request carries the HttpOnly cookie set when the booking was
 *       created (same browser session — handles guest checkout), or
 *   (b) the request is authenticated AND the auth user owns the
 *       customer row attached to the booking.
 *
 * Without one of these, knowing a booking_code is not enough to create
 * Pagar.me orders against someone else's reservation.
 */
async function authorizeBooking(
  bookingCode: string,
  customerId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const jar = await cookies();
  const signed = jar.get(cookieNameFor(bookingCode))?.value;
  if (verifyBookingCode(bookingCode, signed)) {
    return { ok: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      error:
        'Sessão expirou. Volte para a página de detalhes da reserva e tente novamente.',
    };
  }

  const admin = createAdminClient();
  const { data: customer } = await admin
    .from('customers')
    .select('auth_user_id')
    .eq('id', customerId)
    .maybeSingle();
  if (customer?.auth_user_id && customer.auth_user_id === user.id) {
    return { ok: true };
  }
  return { ok: false, error: 'Esta reserva não pertence a este usuário.' };
}

/**
 * Create a PIX order for an existing pending booking. The server reads the
 * booking from the DB (admin client, since RLS would otherwise block public
 * reads) and re-derives the amount — never trusting the client.
 *
 * Gated by canPay(customerEmail) which honours PAGARME_MODE, and by
 * authorizeBooking() which proves the caller created/owns the booking.
 */
export async function createPixForBookingAction(
  bookingCode: string
): Promise<CreatePixResult> {
  const headersList = await headers();
  const ip = getClientIp(headersList);
  const limit = await paymentLimiter.limit(ip);
  if (!limit.success) {
    return {
      ok: false,
      error: 'Muitas tentativas de pagamento. Aguarde alguns minutos.',
    };
  }
  const admin = createAdminClient();

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select(
      'id, booking_code, status, total_cents, passenger_count, customer_id, tour_id, expires_at'
    )
    .eq('booking_code', bookingCode)
    .maybeSingle();

  if (bookingError) return { ok: false, error: 'Falha ao carregar reserva' };
  if (!booking) return { ok: false, error: 'Reserva não encontrada' };
  if (booking.status !== 'pending_payment') {
    return { ok: false, error: `Reserva já está ${booking.status}` };
  }
  if (booking.expires_at && new Date(booking.expires_at) < new Date()) {
    return { ok: false, error: 'Reserva expirou. Faça uma nova reserva.' };
  }

  const auth = await authorizeBooking(bookingCode, booking.customer_id);
  if (!auth.ok) return auth;

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
      // Aligned with the booking soft-hold TTL (10 min). If the cliente
      // pays later than that, the booking is already cancelled and the
      // webhook will reject the payment.
      expiresInSeconds: 600,
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
    console.error('[createPixForBookingAction] error', err);
    return { ok: false, error: 'Falha ao gerar PIX. Tente novamente em instantes.' };
  }
}

export type CreateCardResult =
  | { ok: true; status: 'paid' | 'pending' | 'failed'; bookingCode: string }
  | { ok: false; error: string };

/**
 * Charge an existing pending booking with a tokenized card. Amount comes
 * from booking.total_cents (server-side), never from the client.
 *
 * Card auth is synchronous in Pagar.me: if status === 'paid', we eagerly
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
  const headersList = await headers();
  const ip = getClientIp(headersList);
  const limit = await paymentLimiter.limit(ip);
  if (!limit.success) {
    return {
      ok: false,
      error: 'Muitas tentativas de pagamento. Aguarde alguns minutos.',
    };
  }
  const admin = createAdminClient();

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select('id, booking_code, status, total_cents, customer_id, tour_id, expires_at')
    .eq('booking_code', input.bookingCode)
    .maybeSingle();

  if (bookingError) return { ok: false, error: 'Falha ao carregar reserva' };
  if (!booking) return { ok: false, error: 'Reserva não encontrada' };
  if (booking.status !== 'pending_payment') {
    return { ok: false, error: `Reserva já está ${booking.status}` };
  }
  if (booking.expires_at && new Date(booking.expires_at) < new Date()) {
    return { ok: false, error: 'Reserva expirou. Faça uma nova reserva.' };
  }

  const auth = await authorizeBooking(input.bookingCode, booking.customer_id);
  if (!auth.ok) return auth;

  const [{ data: customer }, { data: tour }] = await Promise.all([
    admin
      .from('customers')
      .select('email, full_name, phone, cpf')
      .eq('id', booking.customer_id)
      .maybeSingle(),
    admin.from('tours').select('name, tour_type').eq('id', booking.tour_id).maybeSingle(),
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

  // Pagamento SEMPRE à vista (decisão 23/jul): sem parcelamento em nenhum
  // tour. O client nem mostra o seletor; qualquer pedido >1x é rejeitado.
  const requestedInstallments = Math.max(1, Math.min(input.installments ?? 1, 12));
  if (requestedInstallments > 1) {
    return { ok: false, error: 'Pagamento apenas à vista (sem parcelamento).' };
  }

  try {
    const order = await createCreditCardOrder({
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      amountCents: booking.total_cents,
      description: `${tour.name} — ${booking.booking_code}`,
      cardToken: input.cardToken,
      installments: requestedInstallments,
      customer: {
        name: input.cardHolderName.trim() || customer.full_name || customer.email,
        email: customer.email,
        phone: customer.phone ?? undefined,
        document: customer.cpf ?? undefined,
      },
    });

    const charge = order.charges?.[0];
    const status = (order.status ?? '').toLowerCase();

    if (status === 'paid' && charge?.id) {
      const { data: didSend, error: rpcError } = await admin.rpc(
        'confirm_booking_payment_v2',
        {
          p_booking_id: booking.id,
          p_pagarme_order_id: order.id,
          p_pagarme_charge_id: charge.id,
          p_payment_method: 'credit_card',
          p_amount_cents: order.amount,
          p_paid_at: charge.paid_at ?? new Date().toISOString(),
          p_raw_response: order as never,
        }
      );
      if (rpcError) {
        console.error('[createCardForBookingAction] confirm rpc error', rpcError);
        return { ok: false, error: 'Pagamento aprovado mas falha ao registrar. Aguarde alguns segundos.' };
      }
      if (didSend === true) {
        const { sendBookingConfirmationFor } = await import('@/lib/email-flow');
        await sendBookingConfirmationFor(admin, booking.id).catch((e) =>
          console.error('[createCardForBookingAction] email send failed', e)
        );
      }
      return { ok: true, status: 'paid', bookingCode: booking.booking_code };
    }

    if (status === 'failed' || status === 'canceled') {
      return { ok: false, error: 'Pagamento recusado pela operadora.' };
    }

    return { ok: true, status: 'pending', bookingCode: booking.booking_code };
  } catch (err) {
    console.error('[createCardForBookingAction] error', err);
    return { ok: false, error: 'Falha ao processar pagamento. Tente novamente.' };
  }
}
