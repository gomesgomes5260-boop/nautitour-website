// E-mail enviado ao cliente quando admin altera data/hora de uma saída
// que tem booking ativa.

export type ScheduleChangedPayload = {
  bookingCode: string;
  customerName: string;
  tourName: string;
  oldDepartureAt: string; // ISO
  newDepartureAt: string; // ISO
  siteUrl: string;
};

function formatDeparture(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
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

export function renderScheduleChanged(p: ScheduleChangedPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const oldDep = formatDeparture(p.oldDepartureAt);
  const newDep = formatDeparture(p.newDepartureAt);
  const safeName = escapeHtml(p.customerName || 'Cliente');
  const safeTour = escapeHtml(p.tourName);
  const safeCode = escapeHtml(p.bookingCode);
  const bookingUrl = `${p.siteUrl.replace(/\/$/, '')}/reserva/${encodeURIComponent(p.bookingCode)}`;
  const subject = `Mudança de horário — ${p.bookingCode}`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
        <tr><td style="background:#C00010;padding:24px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;">Mudança no seu passeio</h1>
        </td></tr>
        <tr><td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:16px;">Olá, ${safeName}!</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
            Houve uma <strong>alteração no horário</strong> da sua reserva
            <strong>${safeCode}</strong> (${safeTour}). Confira abaixo e qualquer dúvida,
            é só responder este e-mail ou falar com a gente pelo WhatsApp.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:10px 14px;background:#f4f6f8;border-radius:6px;font-size:13px;color:#888;text-decoration:line-through;">
              <strong style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin-bottom:4px;text-decoration:none;">Horário anterior</strong>
              ${escapeHtml(oldDep)}
            </td></tr>
            <tr><td style="padding:14px;background:#FCEAEC;border:1px solid #F8C6CB;border-radius:6px;font-size:15px;color:#6E0000;font-weight:bold;margin-top:8px;">
              <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#980010;font-weight:bold;margin-bottom:6px;">Novo horário</span>
              ${escapeHtml(newDep)}
            </td></tr>
          </table>

          <p style="margin:24px 0 8px;font-size:14px;">
            <a href="${bookingUrl}" style="background:#404040;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Ver reserva atualizada</a>
          </p>
          <p style="margin:24px 0 0;font-size:13px;color:#555;line-height:1.5;">
            Não consegue na nova data? Avise a gente assim que puder.
          </p>
        </td></tr>
        <tr><td style="background:#f4f6f8;padding:16px 24px;text-align:center;font-size:12px;color:#888;">
          Nautitour · Passeios de barco em Armação dos Búzios
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Olá, ${p.customerName || 'Cliente'}!`,
    '',
    `Houve uma alteração no horário da sua reserva ${p.bookingCode} (${p.tourName}).`,
    '',
    `Horário anterior: ${oldDep}`,
    `Novo horário:    ${newDep}`,
    '',
    `Detalhes: ${bookingUrl}`,
    '',
    'Nautitour — Armação dos Búzios',
  ].join('\n');

  return { subject, html, text };
}
