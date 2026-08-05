import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { renderBookingReviewRequest } from '@/lib/email-templates/booking-review-request';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Pós-passeio: roda 1x/dia via Vercel Cron (13:00 UTC = 10:00 BRT) e pede
 * avaliação no Google pra reservas confirmadas/embarcadas cuja saída foi nos
 * últimos 3 dias (janela larga = tolera falha de envio/execução; a coluna
 * review_request_sent_at garante no máximo 1 e-mail por reserva).
 *
 * Sem a env GOOGLE_REVIEW_URL o cron fica adormecido (nada é enviado nem
 * marcado) — deploy seguro antes de o link do Google Business existir.
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

  const reviewUrl = process.env.GOOGLE_REVIEW_URL;
  if (!reviewUrl) {
    return NextResponse.json({ ok: true, disabled: 'GOOGLE_REVIEW_URL not set' });
  }

  // Janela: saídas de D-3 até hoje 00:00 BRT (UTC-3 fixo, sem DST).
  const brtNow = new Date(Date.now() - 3 * 3600_000);
  const y = brtNow.getUTCFullYear();
  const m = brtNow.getUTCMonth();
  const d = brtNow.getUTCDate();
  const startIso = new Date(Date.UTC(y, m, d - 3, 3, 0, 0)).toISOString();
  const endIso = new Date(Date.UTC(y, m, d, 3, 0, 0)).toISOString();

  const admin = createAdminClient();
  const { data: bookings, error } = await admin
    .from('bookings')
    .select(
      `
      id, booking_code,
      tour:tours ( name ),
      schedule:tour_schedules!inner ( departure_at ),
      customer:customers ( email, full_name )
      `
    )
    .in('status', ['confirmed', 'completed'])
    .is('review_request_sent_at', null)
    .gte('schedule.departure_at', startIso)
    .lt('schedule.departure_at', endIso);

  if (error) {
    console.error('[cron reviews] query error', error);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }

  type Row = {
    id: string;
    booking_code: string;
    tour: { name: string } | { name: string }[] | null;
    schedule: { departure_at: string } | { departure_at: string }[] | null;
    customer:
      | { email: string; full_name: string | null }
      | { email: string; full_name: string | null }[]
      | null;
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nautitour-website.vercel.app';
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const raw of (bookings ?? []) as unknown as Row[]) {
    const tour = Array.isArray(raw.tour) ? raw.tour[0] : raw.tour;
    const customer = Array.isArray(raw.customer) ? raw.customer[0] : raw.customer;

    // Placeholder de venda sem email (RFC 2606) — inentregável, pula e marca
    // pra não reprocessar todo dia.
    if (!customer?.email || customer.email.endsWith('.invalid')) {
      skipped++;
      await admin
        .from('bookings')
        .update({ review_request_sent_at: new Date().toISOString() })
        .eq('id', raw.id);
      continue;
    }

    const { subject, html, text } = renderBookingReviewRequest({
      bookingCode: raw.booking_code,
      customerName: customer.full_name ?? '',
      tourName: tour?.name ?? 'passeio Nautitour',
      reviewUrl,
      siteUrl,
      // Rota interna: conta o clique no KPI e cai no rodízio da equipe.
      waUrl: `${siteUrl.replace(/\/$/, '')}/api/wa?s=email-review&code=${encodeURIComponent(raw.booking_code)}`,
    });

    const result = await sendEmail({ to: customer.email, subject, html, text });
    if (result.ok) {
      sent++;
      await admin
        .from('bookings')
        .update({ review_request_sent_at: new Date().toISOString() })
        .eq('id', raw.id);
    } else {
      // Não marca — a janela de 3 dias dá mais 2 tentativas diárias.
      failed++;
      const reason = 'error' in result ? result.error : result.reason;
      console.error('[cron reviews] send failed', raw.booking_code, reason);
    }
  }

  return NextResponse.json({ ok: true, window: { startIso, endIso }, sent, skipped, failed });
}
