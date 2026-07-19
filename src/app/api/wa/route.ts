import { NextRequest, NextResponse } from 'next/server';
import { buildWaUrl } from '@/lib/whatsapp';
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
    case 'email-cancel': {
      const code = req.nextUrl.searchParams.get('code') ?? '';
      if (!BOOKING_CODE_RE.test(code)) return null;
      return `Olá! Cancelei a reserva ${code} pelo site e tenho uma dúvida.`;
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

  try {
    const admin = createAdminClient();
    await admin.from('whatsapp_clicks').insert({ source });
  } catch (err) {
    console.error('[wa] falha ao registrar clique', err);
  }

  return NextResponse.redirect(buildWaUrl(message), 302);
}
