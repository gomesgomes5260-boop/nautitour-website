export type ScheduleCancelledPayload = {
  bookingCode: string;
  customerName: string;
  tourName: string;
  departureAt: string | null;
  /** Motivo informado pelo admin ao bloquear a saída (clima, Marinha etc). */
  reason: string | null;
  siteUrl: string;
  /** WhatsApp de contato: do vendedor (reserva de vendedor) ou da empresa. */
  waUrl: string;
  contactLabel: string;
};

function formatDeparture(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Passeio (saída) cancelado pela operação — tipicamente condições
 * climáticas ou determinação da Marinha do Brasil. CTA de reagendamento
 * pelo site + contato direto (vendedor ou equipe).
 */
export function renderScheduleCancelled(p: ScheduleCancelledPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const safeName = escapeHtml(p.customerName || 'Cliente');
  const safeTour = escapeHtml(p.tourName);
  const departure = formatDeparture(p.departureAt);
  const site = p.siteUrl.replace(/\/$/, '');
  const safeContact = escapeHtml(p.contactLabel);

  const subject = `Passeio cancelado — vamos reagendar? (${p.bookingCode})`;

  const reasonHtml = p.reason?.trim()
    ? `<p style="margin:8px 0 0;font-size:13px;color:#555;">Motivo informado pela operação: ${escapeHtml(p.reason.trim())}</p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
        <tr>
          <td style="background:#C00010;padding:24px;text-align:center;">
            <img src="${site}/brand/logo-white.png" alt="Nautitour" width="60" height="44" style="display:block;margin:0 auto;border:0;outline:none;" />
            <p style="margin:10px 0 0;color:#ffd6d9;font-size:14px;">Aviso importante sobre o seu passeio</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <p style="margin:0 0 16px;font-size:16px;">Olá, ${safeName}!</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
              Precisamos cancelar a saída do seu passeio <strong>${safeTour}</strong>${
                departure ? ` de <span style="text-transform:capitalize;">${escapeHtml(departure)}</span>` : ''
              } (reserva <strong>${escapeHtml(p.bookingCode)}</strong>).
            </p>
            <div style="background:#f0f9ff;border:1px solid #7dd3fc;border-radius:6px;padding:14px 16px;margin:16px 0;">
              <p style="margin:0;font-size:13px;line-height:1.5;color:#075985;">
                Cancelamentos assim acontecem por <strong>condições climáticas</strong>
                ou <strong>determinação da Marinha do Brasil</strong> — a segurança
                de vocês a bordo vem sempre em primeiro lugar. ⚓
              </p>
              ${reasonHtml}
            </div>
            <p style="margin:16px 0;font-size:15px;line-height:1.5;">
              <strong>Você não perde nada:</strong> é só escolher uma nova data
              pelo site, ou falar direto com ${safeContact} pra reagendar ou
              combinar o reembolso.
            </p>
            <p style="margin:24px 0 8px;font-size:14px;">
              <a href="${site}/passeio-escuna" style="background:#C00010;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Reagendar pelo site</a>
              &nbsp;&nbsp;
              <a href="${p.waUrl}" style="background:#ffffff;color:#404040;border:1px solid #d4d4d4;padding:11px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Falar com ${safeContact}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f4f6f8;padding:16px 24px;text-align:center;font-size:12px;color:#888;">
            Nautitour · Passeios de barco em Armação dos Búzios
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Olá, ${p.customerName || 'Cliente'}!`,
    '',
    `Precisamos cancelar a saída do seu passeio ${p.tourName}${departure ? ` de ${departure}` : ''} (reserva ${p.bookingCode}).`,
    '',
    'Cancelamentos assim acontecem por condições climáticas ou determinação da Marinha do Brasil — a segurança de vocês vem sempre em primeiro lugar.',
    ...(p.reason?.trim() ? [`Motivo informado pela operação: ${p.reason.trim()}`] : []),
    '',
    'Você não perde nada: escolha uma nova data pelo site ou fale direto com ' + p.contactLabel + ' pra reagendar ou combinar o reembolso.',
    '',
    `Reagendar: ${site}/passeio-escuna`,
    `WhatsApp: ${p.waUrl}`,
    '',
    'Nautitour — Armação dos Búzios',
  ].join('\n');

  return { subject, html, text };
}
