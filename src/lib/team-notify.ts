import 'server-only';
import { sendEmail } from '@/lib/email';

// Notificações internas pra caixa da equipe (reservas@nautitour.com.br).
// Cada reserva nova e cada atualização feita pelo cliente chega lá pra
// equipe se preparar pra recepção.
//
// Gate: env TEAM_NOTIFY_EMAIL — sem ela, no-op silencioso (dev/preview).
// Sempre best-effort: falha aqui nunca propaga pro fluxo do cliente.

const BRT_DATETIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const PRICE = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatBrtDateTime(iso: string | null): string {
  if (!iso) return 'a definir';
  return BRT_DATETIME.format(new Date(iso));
}

export function formatPriceCents(cents: number): string {
  return PRICE.format(cents / 100);
}

type Field = [label: string, value: string | null | undefined];

/**
 * Monta e envia um e-mail interno simples (tabela label/valor). `fields`
 * com valor vazio são omitidos. Nunca lança.
 */
export async function notifyTeam(
  subject: string,
  fields: Field[],
  adminUrl?: string
): Promise<void> {
  const to = process.env.TEAM_NOTIFY_EMAIL;
  if (!to) return;

  const rows = fields.filter((f): f is [string, string] => Boolean(f[1]));
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #1f1f1f; max-width: 560px;">
      <h2 style="font-size: 17px; margin: 0 0 14px;">${escapeHtml(subject)}</h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        ${rows
          .map(
            ([label, value]) => `
        <tr>
          <td style="padding: 6px 12px 6px 0; font-size: 13px; color: #6b6b6b; white-space: nowrap; vertical-align: top;">${escapeHtml(label)}</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: bold;">${escapeHtml(value)}</td>
        </tr>`
          )
          .join('')}
      </table>
      ${
        adminUrl
          ? `<p style="margin: 16px 0 0;"><a href="${adminUrl}" style="font-size: 13px; color: #C00010;">Abrir no painel →</a></p>`
          : ''
      }
      <p style="margin: 18px 0 0; font-size: 11px; color: #9b9b9b;">
        Notificação automática do site Nautitour.
      </p>
    </div>`;
  const text = rows.map(([label, value]) => `${label}: ${value}`).join('\n');

  try {
    const result = await sendEmail({ to, subject, html, text });
    if (!result.ok && 'error' in result) {
      console.error('[team-notify] envio falhou', result.error);
    }
  } catch (err) {
    console.error('[team-notify] erro inesperado', err);
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
