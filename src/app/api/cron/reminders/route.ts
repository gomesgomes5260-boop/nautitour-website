import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { renderBookingReminder } from '@/lib/email-templates/booking-reminder';
import { sendSms, toSmsReceiver } from '@/lib/sms';
import { buildReminderSms } from '@/lib/sms-messages';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Lembrete D-1: roda 1x/dia via Vercel Cron (18:00 UTC = 15:00 BRT) e envia
 * email + SMS pra toda reserva confirmada com saída AMANHÃ (em BRT) que ainda
 * não recebeu lembrete. Cada canal tem idempotência PRÓPRIA
 * (reminder_sent_at / reminder_sms_sent_at) — rodar duas vezes não duplica, e
 * a falha de um canal não bloqueia nem re-dispara o outro.
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
      id, booking_code, passenger_count, reminder_sent_at, reminder_sms_sent_at,
      tour:tours ( name ),
      schedule:tour_schedules!inner ( departure_at, pier:embarkation_piers ( name, address, fee_cents ) ),
      customer:customers ( email, full_name, phone )
      `
    )
    .eq('status', 'confirmed')
    .or('reminder_sent_at.is.null,reminder_sms_sent_at.is.null')
    .gte('schedule.departure_at', startIso)
    .lt('schedule.departure_at', endIso);

  if (error) {
    console.error('[cron reminders] query error', error);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }

  type PierJoined = { name: string; address: string | null; fee_cents: number };
  type CustomerJoined = { email: string; full_name: string | null; phone: string | null };
  type Row = {
    id: string;
    booking_code: string;
    passenger_count: number;
    reminder_sent_at: string | null;
    reminder_sms_sent_at: string | null;
    tour: { name: string } | { name: string }[] | null;
    schedule:
      | { departure_at: string; pier: PierJoined | PierJoined[] | null }
      | { departure_at: string; pier: PierJoined | PierJoined[] | null }[]
      | null;
    customer: CustomerJoined | CustomerJoined[] | null;
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nautitour-website.vercel.app';
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let smsSent = 0;
  let smsSkipped = 0;
  let smsFailed = 0;

  for (const raw of (bookings ?? []) as unknown as Row[]) {
    const tour = Array.isArray(raw.tour) ? raw.tour[0] : raw.tour;
    const schedule = Array.isArray(raw.schedule) ? raw.schedule[0] : raw.schedule;
    const pier = schedule
      ? Array.isArray(schedule.pier)
        ? schedule.pier[0]
        : schedule.pier
      : null;
    const customer = Array.isArray(raw.customer) ? raw.customer[0] : raw.customer;

    // Sem data de saída não dá pra montar nenhuma mensagem — marca os dois
    // canais pra não reprocessar a mesma reserva todo dia.
    if (!schedule?.departure_at) {
      skipped++;
      smsSkipped++;
      await admin
        .from('bookings')
        .update({
          reminder_sent_at: new Date().toISOString(),
          reminder_sms_sent_at: new Date().toISOString(),
        })
        .eq('id', raw.id);
      continue;
    }

    const ticketUrl = `${siteUrl.replace(/\/$/, '')}/ticket/${encodeURIComponent(raw.booking_code)}`;

    // ── Canal e-mail (idempotência: reminder_sent_at) ──────────────────────
    if (raw.reminder_sent_at === null) {
      // Placeholder de venda sem email (RFC 2606) — inentregável, pula e marca.
      if (!customer?.email || customer.email.endsWith('.invalid')) {
        skipped++;
        await admin
          .from('bookings')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', raw.id);
      } else {
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
          ticketUrl,
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
          console.error('[cron reminders] email failed', raw.booking_code, reason);
        }
      }
    }

    // ── Canal SMS (idempotência: reminder_sms_sent_at) ─────────────────────
    if (raw.reminder_sms_sent_at === null) {
      const receiver = toSmsReceiver(customer?.phone);
      if (!receiver) {
        // Telefone ausente/inválido — skip definitivo, marca pra não reprocessar.
        smsSkipped++;
        await admin
          .from('bookings')
          .update({ reminder_sms_sent_at: new Date().toISOString() })
          .eq('id', raw.id);
      } else {
        const content = buildReminderSms({
          departureAt: schedule.departure_at,
          bookingCode: raw.booking_code,
          ticketUrl,
        });
        const result = await sendSms({ to: receiver, content });
        if (result.ok) {
          smsSent++;
          await admin
            .from('bookings')
            .update({ reminder_sms_sent_at: new Date().toISOString() })
            .eq('id', raw.id);
          const { error: evErr } = await admin.from('booking_events').insert({
            booking_id: raw.id,
            kind: 'sms_sent',
            payload: { template: 'reminder', request_id: result.id ?? null },
          });
          if (evErr) console.error('[cron reminders] event insert', evErr);
        } else {
          // Não marca — tenta de novo na próxima execução (se ainda for D-1).
          smsFailed++;
          const reason = 'error' in result ? result.error : result.reason;
          console.error('[cron reminders] sms failed', raw.booking_code, reason);
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    window: { startIso, endIso },
    email: { sent, skipped, failed },
    sms: { sent: smsSent, skipped: smsSkipped, failed: smsFailed },
  });
}
