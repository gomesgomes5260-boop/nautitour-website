import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { renderLeadRecovery } from '@/lib/email-templates/lead-recovery';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Recuperação de checkout abandonado: roda de hora em hora via Vercel Cron
 * e envia UM e-mail "complete sua reserva" pra leads capturados entre 1h e
 * 48h atrás (create_lead_invitation, PR #68) que não fecharam reserva.
 *
 * Regras:
 *  - 1h de carência: quem acabou de sair pode voltar sozinho — não atropela.
 *  - Pula (e marca) quem tem QUALQUER reserva não-cancelada criada depois da
 *    captura — o lead virou cliente, não precisa de empurrão.
 *  - Idempotente via lead_invitations.recovery_email_sent_at (aviso único,
 *    como o texto do próprio e-mail promete — LGPD-friendly).
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

  const now = Date.now();
  const startIso = new Date(now - 48 * 3600_000).toISOString();
  const endIso = new Date(now - 1 * 3600_000).toISOString();

  const admin = createAdminClient();
  const { data: leads, error } = await admin
    .from('lead_invitations')
    .select(
      `
      id, created_at, customer_id,
      customer:customers ( email, full_name )
      `
    )
    .is('recovery_email_sent_at', null)
    .is('used_at', null)
    .gte('created_at', startIso)
    .lt('created_at', endIso);

  if (error) {
    console.error('[cron lead-recovery] query error', error);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }

  type Row = {
    id: string;
    created_at: string;
    customer_id: string;
    customer:
      | { email: string; full_name: string | null }
      | { email: string; full_name: string | null }[]
      | null;
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nautitour-website.vercel.app';
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const raw of (leads ?? []) as unknown as Row[]) {
    const customer = Array.isArray(raw.customer) ? raw.customer[0] : raw.customer;
    const markSent = () =>
      admin
        .from('lead_invitations')
        .update({ recovery_email_sent_at: new Date().toISOString() })
        .eq('id', raw.id);

    if (!customer?.email || customer.email.endsWith('.invalid')) {
      skipped++;
      await markSent();
      continue;
    }

    // Lead virou cliente? Reserva não-cancelada criada após a captura.
    const { count } = await admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', raw.customer_id)
      .neq('status', 'cancelled')
      .gte('created_at', raw.created_at);
    if ((count ?? 0) > 0) {
      skipped++;
      await markSent();
      continue;
    }

    const { subject, html, text } = renderLeadRecovery({
      customerName: customer.full_name ?? '',
      siteUrl,
      // Rota interna: conta o clique no KPI e cai no rodízio da equipe.
      waUrl: `${siteUrl.replace(/\/$/, '')}/api/wa?s=email-lead`,
    });

    const result = await sendEmail({ to: customer.email, subject, html, text });
    if (result.ok) {
      sent++;
      await markSent();
    } else {
      // Não marca — a janela de 48h dá mais tentativas horárias.
      failed++;
      const reason = 'error' in result ? result.error : result.reason;
      console.error('[cron lead-recovery] send failed', raw.id, reason);
    }
  }

  return NextResponse.json({ ok: true, window: { startIso, endIso }, sent, skipped, failed });
}
