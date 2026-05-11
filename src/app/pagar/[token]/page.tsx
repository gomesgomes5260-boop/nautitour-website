import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookieNameFor, signBookingCode } from '@/lib/booking-session';

export const dynamic = 'force-dynamic';

// Recebe um payment_link_token gerado pela conversão inquiry→booking
// (PR-K). Valida o token, setta cookie HMAC do booking, e redireciona
// pro fluxo padrão de pagamento. Cliente que não passou pelo /checkout
// (porque foi convertido pelo admin) ainda consegue pagar.

export default async function PagarTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length < 16) notFound();

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('booking_code, status, expires_at')
    .eq('payment_link_token', token)
    .maybeSingle();

  if (!booking) notFound();

  // Status terminal? Manda direto pra página da reserva (mostra estado real).
  if (booking.status !== 'pending_payment') {
    redirect(`/reserva/${booking.booking_code}`);
  }
  if (booking.expires_at && new Date(booking.expires_at) < new Date()) {
    redirect(`/reserva/${booking.booking_code}?expired=1`);
  }

  // Setta cookie HMAC (mesma assinatura usada pelo /checkout). authorizeBooking
  // em actions.ts vai aceitar e liberar a criação de PIX/cartão.
  const jar = await cookies();
  jar.set(cookieNameFor(booking.booking_code), signBookingCode(booking.booking_code), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });

  redirect(`/reserva/${booking.booking_code}/pagamento`);
}
