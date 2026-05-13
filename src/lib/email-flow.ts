import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { sendEmail, type SendResult } from '@/lib/email';
import { renderBookingConfirmation } from '@/lib/email-templates/booking-confirmation';

type Admin = SupabaseClient<Database>;

export async function sendBookingConfirmationFor(
  admin: Admin,
  bookingId: string
): Promise<SendResult> {
  const { data, error } = await admin
    .from('bookings')
    .select(
      `
      booking_code,
      passenger_count,
      total_cents,
      currency,
      tour:tours ( name ),
      schedule:tour_schedules ( departure_at, pier:embarkation_piers ( name, address, fee_cents ) ),
      customer:customers ( email, full_name )
      `
    )
    .eq('id', bookingId)
    .maybeSingle();

  if (error) {
    console.error('[email-flow] erro ao carregar booking', error);
    return { ok: false, error: 'failed to load booking' };
  }
  if (!data) {
    return { ok: false, error: 'booking not found' };
  }

  type PierJoined = { name: string; address: string | null; fee_cents: number };
  type Joined = {
    booking_code: string;
    passenger_count: number;
    total_cents: number;
    currency: string;
    tour: { name: string } | { name: string }[] | null;
    schedule:
      | { departure_at: string; pier: PierJoined | PierJoined[] | null }
      | { departure_at: string; pier: PierJoined | PierJoined[] | null }[]
      | null;
    customer:
      | { email: string; full_name: string | null }
      | { email: string; full_name: string | null }[]
      | null;
  };
  const b = data as unknown as Joined;
  const tour = Array.isArray(b.tour) ? b.tour[0] : b.tour;
  const schedule = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
  const pier = schedule
    ? Array.isArray(schedule.pier)
      ? schedule.pier[0]
      : schedule.pier
    : null;
  const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;

  if (!customer?.email) {
    return { ok: false, error: 'customer has no email' };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://nautitour-website.vercel.app';

  const { subject, html, text } = renderBookingConfirmation({
    bookingCode: b.booking_code,
    customerName: customer.full_name ?? '',
    tourName: tour?.name ?? 'Passeio Nautitour',
    departureAt: schedule?.departure_at ?? null,
    passengerCount: b.passenger_count,
    totalCents: b.total_cents,
    currency: b.currency,
    siteUrl,
    pier: pier
      ? {
          name: pier.name,
          address: pier.address,
          feeCents: pier.fee_cents,
        }
      : null,
  });

  return sendEmail({ to: customer.email, subject, html, text });
}
