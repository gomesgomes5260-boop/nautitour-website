import { NextRequest, NextResponse } from 'next/server';
import { buildWaUrl, pickWhatsAppNumber } from '@/lib/whatsapp';
import { createAdminClient } from '@/lib/supabase/admin';

// Redireciona pro WhatsApp registrando o clique em `whatsapp_clicks` — a
// contagem do KPI do admin só inclui redirects de fato servidos por aqui.
// A origem fica na coluna `source` (decisão 19/jul: sem marcador visível
// no texto pro cliente — confundia).
//
// O log é best-effort: falha de banco nunca bloqueia o redirect (o cliente
// indo pro WhatsApp é mais importante que a métrica). `/api/` já está no
// Disallow do robots.ts — crawlers não inflam a contagem.

export const dynamic = 'force-dynamic';

const BOOKING_CODE_RE = /^[A-Za-z0-9-]{4,20}$/;
const TITLE_RE = /[^\p{L}\p{N}\s\-.,!?']/gu;

function messageFor(source: string, req: NextRequest): string | null {
  switch (source) {
    case 'fab':
      return 'Olá! Gostaria de saber mais sobre os passeios.';
    case 'lancha':
      return 'Olá! Gostaria de consultar um horário diferente para a lancha privativa.';
    case 'lancha-data': {
      // Consulta de disponibilidade a partir do calendário da lancha
      // (dt = YYYY-MM-DDTHH:MM em BRT). A lancha não fecha reserva pelo
      // site — o atendente confirma e registra manual no painel.
      const dt = req.nextUrl.searchParams.get('dt') ?? '';
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dt)) return null;
      const [date, time] = dt.split('T');
      const [, month, day] = date.split('-');
      return `Olá! Quero consultar a disponibilidade da lancha privativa para o dia ${day}/${month} às ${time}. Pode me ajudar?`;
    }
    case 'blog': {
      const raw = req.nextUrl.searchParams.get('t') ?? '';
      const title = raw.replace(TITLE_RE, '').trim().slice(0, 80);
      return title
        ? `Oi! Vim do post "${title}" e quero um orçamento da lancha privativa.`
        : 'Oi! Vim do blog e quero um orçamento da lancha privativa.';
    }
    case 'pagamento': {
      const code = req.nextUrl.searchParams.get('code') ?? '';
      if (!BOOKING_CODE_RE.test(code)) return null;
      return `Olá! Quero finalizar a reserva ${code}.`;
    }
    case 'pagamento-cartao': {
      // Cliente cujo cartão foi recusado/deu erro no checkout.
      const code = req.nextUrl.searchParams.get('code') ?? '';
      if (!BOOKING_CODE_RE.test(code)) return null;
      return `Olá! Tentei pagar a reserva ${code} no cartão e não consegui. Podem me ajudar?`;
    }
    case 'email-cancel': {
      const code = req.nextUrl.searchParams.get('code') ?? '';
      if (!BOOKING_CODE_RE.test(code)) return null;
      return `Olá! Cancelei a reserva ${code} pelo site e tenho uma dúvida.`;
    }
    case 'email-lead':
      // Link do e-mail de recuperação de checkout abandonado.
      return 'Olá! Estava fazendo uma reserva no site e fiquei com uma dúvida.';
    case 'email-review': {
      // Link "algo não saiu como esperado?" do e-mail pós-passeio.
      const code = req.nextUrl.searchParams.get('code') ?? '';
      if (!BOOKING_CODE_RE.test(code)) return null;
      return `Olá! Acabei de fazer o passeio da reserva ${code} e gostaria de falar com vocês.`;
    }
    default:
      return null;
  }
}

export async function GET(req: NextRequest) {
  const source = req.nextUrl.searchParams.get('s') ?? '';
  const message = messageFor(source, req);

  // Origem desconhecida/param inválido: redireciona sem texto e sem contar.
  if (message === null) {
    return NextResponse.redirect(buildWaUrl(), 302);
  }

  // Sorteia o atendente AQUI pra registrar pra qual número o cliente foi
  // direcionado (pedido do admin, 05/ago) — o mesmo número vai no redirect.
  const waNumber = pickWhatsAppNumber();

  try {
    const admin = createAdminClient();
    await admin.from('whatsapp_clicks').insert({ source, wa_number: waNumber });
  } catch (err) {
    console.error('[wa] falha ao registrar clique', err);
  }

  return NextResponse.redirect(buildWaUrl(message, waNumber), 302);
}
