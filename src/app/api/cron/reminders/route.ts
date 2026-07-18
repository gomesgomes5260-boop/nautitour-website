import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { renderBookingReminder } from '@/lib/email-templates/booking-reminder';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Lembrete D-1: roda 1x/dia via Vercel Cron (18:00 UTC = 15:00 BRT) e envia
 * email pra toda reserva confirmada com saída AMANHÃ (em BRT) que ainda não
 * recebeu lembrete. Idempotente via reminder_sent_at — rodar duas vezes não
 * duplica envio.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Janela de "amanhã" em BRT (UTC-3 fixo, sem DST desde 2019):
  // meia-noite BRT = 03:00 UTC do mesmo dia.
  const brtNow = new Date(Date.now() - 3 * 3600_000);
  const y = brtNow.getUTCFullYear();
  const m = brtNow.getUTCMonth();
  const d = brtNow.getUTCDate();
  const startIso = new Date(Date.UTC(y, m, d + 1, 3, 0, 0)).toISOString();
  const endIso = new Date(Date.UTC(y, m, d + 2, 3, 0, 0)).toISOString();

  const admin = createAdminClient();
  const { data: bookings, error } = await admin
    .from('bookings')
    .select(
      `
      id, booking_code, passenger_count,
      tour:tours ( name ),
      schedule:tour_schedules!inner ( departure_at, pier:embarkation_piers ( name, address, fee_cents ) ),
      customer:customers ( email, full_name )
      `
    )
    .eq('status', 'confirmed')
    .is('reminder_sent_at', null)
    .gte('schedule.departure_at', startIso)
    .lt('schedule.departure_at', endIso);

  if (error) {
    console.error('[cron reminders] query error', error);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }

  type PierJoined = { name: string; address: string | null; fee_cents: number };
  type Row = {
    id: string;
    booking_code: string;
    passenger_count: number;
    tour: { name: string } | { name: string }[] | null;
    schedule:
      | { departure_at: string; pier: PierJoined | PierJoined[] | null }
      | { departure_at: string; pier: PierJoined | PierJoined[] | null }[]
      | null;
    customer: { email: string; full_name: string | null } | { email: string; full_name: string | null }[] | null;
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nautitour-website.vercel.app';
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const raw of (bookings ?? []) as unknown as Row[]) {
    const tour = Array.isArray(raw.tour) ? raw.tour[0] : raw.tour;
    const schedule = Array.isArray(raw.schedule) ? raw.schedule[0] : raw.schedule;
    const pier = schedule
      ? Array.isArray(schedule.pier)
        ? schedule.pier[0]
        : schedule.pier
      : null;
    const customer = Array.isArray(raw.customer) ? raw.customer[0] : raw.customer;

    // Placeholder de venda sem email (RFC 2606) — inentregável, pula.
    if (!customer?.email || customer.email.endsWith('.invalid') || !schedule?.departure_at) {
      skipped++;
      // Marca mesmo assim pra não reprocessar a mesma reserva todo dia.
      await admin
        .from('bookings')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', raw.id);
      continue;
    }

    const { subject, html, text } = renderBookingReminder({
      bookingCode: raw.booking_code,
      customerName: customer.full_name ?? '',
      tourName: tour?.name ?? 'Passeio Nautitour',
      departureAt: schedule.departure_at,
      passengerCount: raw.passenger_count,
      siteUrl,
      pier: pier
        ? { name: pier.name, address: pier.address, feeCents: pier.fee_cents }
        : null,
      ticketUrl: `${siteUrl.replace(/\/$/, '')}/ticket/${encodeURIComponent(raw.booking_code)}`,
    });

    const result = await sendEmail({ to: customer.email, subject, html, text });
    if (result.ok) {
      sent++;
      await admin
        .from('bookings')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', raw.id);
    } else {
      // Não marca — tenta de novo na próxima execução (se ainda for D-1).
      failed++;
      const reason = 'error' in result ? result.error : result.reason;
      console.error('[cron reminders] send failed', raw.booking_code, reason);
    }
  }

  return NextResponse.json({ ok: true, window: { startIso, endIso }, sent, skipped, failed });
}
