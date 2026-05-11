export type BookingConfirmationPayload = {
  bookingCode: string;
  customerName: string;
  tourName: string;
  departureAt: string | null;
  passengerCount: number;
  totalCents: number;
  currency: string;
  siteUrl: string;
};

function formatBRL(cents: number, currency: string): string {
  if (currency.toUpperCase() === 'BRL') {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

function formatDeparture(iso: string | null): string {
  if (!iso) return 'A combinar';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
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

export function renderBookingConfirmation(p: BookingConfirmationPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const total = formatBRL(p.totalCents, p.currency);
  const departure = formatDeparture(p.departureAt);
  const safeName = escapeHtml(p.customerName || 'Cliente');
  const safeTour = escapeHtml(p.tourName);
  const safeCode = escapeHtml(p.bookingCode);
  const bookingUrl = `${p.siteUrl.replace(/\/$/, '')}/reserva/${encodeURIComponent(p.bookingCode)}`;

  const subject = `Reserva confirmada — ${p.bookingCode}`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
          <tr>
            <td style="background:#096EAB;padding:24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;">Nautitour</h1>
              <p style="margin:8px 0 0;color:#cce7f5;font-size:14px;">Sua reserva está confirmada</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 16px;font-size:16px;">Olá, ${safeName}!</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
                Recebemos seu pagamento. Sua reserva está confirmada. Guarde este e-mail e mostre o código abaixo no embarque.
              </p>
              <div style="background:#f0f9ff;border:1px solid #096EAB;border-radius:6px;padding:16px;text-align:center;margin:16px 0;">
                <p style="margin:0;font-size:13px;color:#555;">Código da reserva</p>
                <p style="margin:6px 0 0;font-size:24px;font-weight:bold;color:#D90006;letter-spacing:1px;">${safeCode}</p>
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#555;">Tour</td>
                  <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;"><strong>${safeTour}</strong></td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#555;">Saída</td>
                  <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;"><strong>${escapeHtml(departure)}</strong></td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#555;">Passageiros</td>
                  <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;"><strong>${p.passengerCount}</strong></td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#555;">Total pago</td>
                  <td style="padding:8px 0;font-size:14px;text-align:right;"><strong>${total}</strong></td>
                </tr>
              </table>
              <p style="margin:24px 0 8px;font-size:14px;">
                <a href="${bookingUrl}" style="background:#096EAB;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Ver detalhes da reserva</a>
              </p>
              <p style="margin:24px 0 0;font-size:13px;color:#555;line-height:1.5;">
                Dúvidas? Responda este e-mail ou fale com a gente pelo WhatsApp.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f4f6f8;padding:16px 24px;text-align:center;font-size:12px;color:#888;">
              Nautitour · Passeios de barco em Arraial do Cabo
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Olá, ${p.customerName || 'Cliente'}!`,
    '',
    'Recebemos seu pagamento. Sua reserva está confirmada.',
    '',
    `Código da reserva: ${p.bookingCode}`,
    `Tour: ${p.tourName}`,
    `Saída: ${departure}`,
    `Passageiros: ${p.passengerCount}`,
    `Total pago: ${total}`,
    '',
    `Detalhes: ${bookingUrl}`,
    '',
    'Nautitour — Arraial do Cabo',
  ].join('\n');

  return { subject, html, text };
}
