import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import {
  buzziosTripDate,
  buzziosTripTime,
  isNautitourSyncEnabled,
  NautitourSyncError,
  normalizePhoneE164,
  registerNautitourBooking,
  type NautitourPaymentMethod,
} from '@/lib/nautitour';

type Admin = SupabaseClient<Database>;

export type SyncResult =
  | { ok: true; bookingId: string; code: string; ticketUrl: string }
  | { ok: true; skipped: 'disabled' | 'already_synced'; reason?: string }
  | { ok: false; error: string };

const METHOD_MAP: Record<string, NautitourPaymentMethod> = {
  pix: 'PIX',
  credit_card: 'CREDIT_CARD',
  boleto: 'CASH',
};

/**
 * Registra um booking confirmado no painel webreservas.xyz, salva o
 * resultado em bookings.nautitour_*, e loga em booking_events.
 *
 * Garantias:
 * - Idempotente: se nautitour_booking_id já existe, faz no-op.
 * - Se NAUTITOUR_API_URL/KEY ausentes, faz no-op silencioso (dev local
 *   continua funcionando sem painel).
 * - Falha do painel é capturada e persistida em nautitour_sync_failed_at /
 *   nautitour_sync_error pra retry manual posterior — não lança, pra
 *   não bloquear o envio do email de confirmação (PIX já foi pago).
 */
export async function syncBookingToPanel(
  admin: Admin,
  bookingId: string,
  opts: { paymentMethod?: string } = {},
): Promise<SyncResult> {
  if (!isNautitourSyncEnabled()) {
    return { ok: true, skipped: 'disabled' };
  }

  // Barreira de idempotência dupla. Checamos os dois sinais que são
  // setados juntos no UPDATE pós-sync:
  //   - nautitour_booking_id: cuid retornado pelo painel
  //   - nautitour_synced_at:  timestamp de conclusão da transação
  // Qualquer um dos dois marca o booking como já sincado. Cobre:
  //   1. Webhook duplicado do Pagar.me (também pego pela RPC v2)
  //   2. Retry manual de admin chamando syncBookingToPanel direto
  //   3. Cron de retry futuro pegando bookings com sync_failed_at
  const { data: existing, error: existingErr } = await admin
    .from('bookings')
    .select('nautitour_booking_id, nautitour_code, nautitour_ticket_url, nautitour_synced_at')
    .eq('id', bookingId)
    .maybeSingle();
  if (existingErr) {
    return { ok: false, error: `lookup failed: ${existingErr.message}` };
  }
  if (existing?.nautitour_synced_at || existing?.nautitour_booking_id) {
    return {
      ok: true,
      skipped: 'already_synced',
      reason: existing.nautitour_code ?? undefined,
    };
  }

  const { data, error } = await admin
    .from('bookings')
    .select(
      `
      id,
      booking_code,
      passenger_count,
      total_cents,
      currency,
      notes,
      schedule:tour_schedules ( departure_at, price_cents, pier:embarkation_piers ( name, slug ) ),
      tour:tours ( base_price_cents ),
      customer:customers ( email, full_name, phone ),
      passengers:booking_passengers ( is_child )
      `,
    )
    .eq('id', bookingId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: `booking lookup failed: ${error.message}` };
  }
  if (!data) {
    return { ok: false, error: 'booking not found' };
  }

  type PierJoined = { name: string; slug: string };
  type ScheduleJoined = {
    departure_at: string;
    price_cents: number | null;
    pier: PierJoined | PierJoined[] | null;
  };
  type Joined = {
    id: string;
    booking_code: string;
    passenger_count: number;
    total_cents: number;
    currency: string;
    notes: string | null;
    schedule: ScheduleJoined | ScheduleJoined[] | null;
    tour: { base_price_cents: number | null } | { base_price_cents: number | null }[] | null;
    customer:
      | { email: string; full_name: string | null; phone: string | null }
      | { email: string; full_name: string | null; phone: string | null }[]
      | null;
    passengers: Array<{ is_child: boolean }>;
  };
  const b = data as unknown as Joined;
  const schedule = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
  const tour = Array.isArray(b.tour) ? b.tour[0] : b.tour;
  const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
  const pier = schedule
    ? Array.isArray(schedule.pier)
      ? schedule.pier[0]
      : schedule.pier
    : null;

  if (!schedule?.departure_at) {
    return { ok: false, error: 'booking has no schedule' };
  }
  if (!customer?.email) {
    return { ok: false, error: 'booking has no customer email' };
  }

  const unitPriceCents = schedule.price_cents ?? tour?.base_price_cents ?? null;
  if (unitPriceCents == null) {
    return { ok: false, error: 'no unit price available' };
  }

  const passengers = b.passengers ?? [];
  const halfPriceQty = passengers.filter((p) => p.is_child).length;
  const fullPriceQty = passengers.length - halfPriceQty;

  const fullPriceValue = unitPriceCents / 100;
  const totalAmount = b.total_cents / 100;

  const paymentMethodKey = (opts.paymentMethod ?? 'pix').toLowerCase();
  const paymentMethod: NautitourPaymentMethod = METHOD_MAP[paymentMethodKey] ?? 'PIX';

  const pierNote = pier?.name ? `Embarque: ${pier.name}` : null;
  const combinedNotes = [b.notes?.trim() || null, pierNote]
    .filter(Boolean)
    .join(' | ');

  try {
    const res = await registerNautitourBooking({
      customerName: customer.full_name ?? customer.email,
      customerPhone: normalizePhoneE164(customer.phone),
      customerEmail: customer.email,
      tripDate: buzziosTripDate(schedule.departure_at),
      tripTime: buzziosTripTime(schedule.departure_at),
      fullPriceQty,
      halfPriceQty,
      fullPriceValue,
      totalAmount,
      paymentMethod,
      paymentReference: b.booking_code,
      needsPickup: false,
      notes: combinedNotes || undefined,
    });

    const { error: saveErr } = await admin
      .from('bookings')
      .update({
        nautitour_booking_id: res.id,
        nautitour_code: res.code,
        nautitour_ticket_url: res.ticketUrl,
        nautitour_synced_at: new Date().toISOString(),
        nautitour_sync_failed_at: null,
        nautitour_sync_error: null,
      })
      .eq('id', bookingId);

    if (saveErr) {
      console.error('[booking-panel-sync] failed to persist sync result', saveErr);
      return { ok: false, error: `persist failed: ${saveErr.message}` };
    }

    await admin
      .from('booking_events')
      .insert({
        booking_id: bookingId,
        kind: 'nautitour_synced',
        payload: {
          nautitour_booking_id: res.id,
          nautitour_code: res.code,
          ticket_url: res.ticketUrl,
        },
      })
      .then(({ error: evErr }) => {
        if (evErr) console.error('[booking-panel-sync] event log failed', evErr);
      });

    return { ok: true, bookingId: res.id, code: res.code, ticketUrl: res.ticketUrl };
  } catch (err) {
    const message =
      err instanceof NautitourSyncError
        ? `[${err.status ?? '?'}] ${err.message}`
        : err instanceof Error
          ? err.message
          : 'unknown error';

    console.error('[booking-panel-sync] panel call failed', {
      bookingId,
      error: message,
    });

    await admin
      .from('bookings')
      .update({
        nautitour_sync_failed_at: new Date().toISOString(),
        nautitour_sync_error: message.slice(0, 1000),
      })
      .eq('id', bookingId);

    await admin
      .from('booking_events')
      .insert({
        booking_id: bookingId,
        kind: 'nautitour_sync_failed',
        payload: { error: message },
      })
      .then(({ error: evErr }) => {
        if (evErr) console.error('[booking-panel-sync] event log failed', evErr);
      });

    return { ok: false, error: message };
  }
}
