export type BookingCancelledPayload = {
  bookingCode: string;
  customerName: string;
  tourName: string;
  departureAt: string | null;
  hadPaidPayment: boolean;
  siteUrl: string;
  waUrl: string;
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
 * Confirmação de cancelamento feito PELO PRÓPRIO cliente (dentro da janela
 * de 48h da política). Cancelamentos de saída pelo admin usam o template
 * schedule-cancelled.
 */
export function renderBookingCancelled(p: BookingCancelledPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const safeName = escapeHtml(p.customerName || 'Cliente');
  const safeTour = escapeHtml(p.tourName);
  const departure = formatDeparture(p.departureAt);
  const site = p.siteUrl.replace(/\/$/, '');

  const subject = `Cancelamento confirmado — ${p.bookingCode}`;

  const refundHtml = p.hadPaidPayment
    ? `<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:14px 16px;margin:16px 0;">
         <p style="margin:0;font-size:13px;line-height:1.5;color:#92400e;">
           <strong>Sobre o reembolso:</strong> identificamos um pagamento nesta
           reserva. Nossa equipe vai processar o estorno pelo mesmo meio de
           pagamento. Se tiver qualquer dúvida, fale com a gente no WhatsApp.
         </p>
       </div>`
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
            <p style="margin:10px 0 0;color:#ffd6d9;font-size:14px;">Cancelamento confirmado</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <p style="margin:0 0 16px;font-size:16px;">Olá, ${safeName}!</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
              Confirmamos o cancelamento da sua reserva
              <strong>${escapeHtml(p.bookingCode)}</strong> — ${safeTour}${
                departure ? `, que sairia em <span style="text-transform:capitalize;">${escapeHtml(departure)}</span>` : ''
              }.
            </p>
            ${refundHtml}
            <p style="margin:16px 0;font-size:15px;line-height:1.5;">
              Mudou de ideia ou quer escolher outra data? A gente adoraria te
              levar pro mar. 🌊
            </p>
            <p style="margin:24px 0 8px;font-size:14px;">
              <a href="${site}/passeio-escuna" style="background:#C00010;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Reservar outra data</a>
              &nbsp;&nbsp;
              <a href="${p.waUrl}" style="background:#ffffff;color:#404040;border:1px solid #d4d4d4;padding:11px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Falar no WhatsApp</a>
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
    `Confirmamos o cancelamento da sua reserva ${p.bookingCode} — ${p.tourName}${departure ? ` (${departure})` : ''}.`,
    ...(p.hadPaidPayment
      ? [
          '',
          'Sobre o reembolso: identificamos um pagamento nesta reserva. Nossa equipe vai processar o estorno pelo mesmo meio de pagamento. Dúvidas? Fale no WhatsApp.',
        ]
      : []),
    '',
    `Reservar outra data: ${site}/passeio-escuna`,
    `WhatsApp: ${p.waUrl}`,
    '',
    'Nautitour — Armação dos Búzios',
  ].join('\n');

  return { subject, html, text };
}
