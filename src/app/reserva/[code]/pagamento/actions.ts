'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { canPay } from '@/lib/pagarme/config';
import { createPixOrder } from '@/lib/pagarme/client';

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
