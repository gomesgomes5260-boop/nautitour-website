export type BookingConfirmationPayload = {
  bookingCode: string;
  customerName: string;
  tourName: string;
  departureAt: string | null;
  passengerCount: number;
  totalCents: number;
  currency: string;
  siteUrl: string;
  pier?: {
    name: string;
    address: string | null;
    feeCents: number;
  } | null;
  /**
   * Painel Nautitour (webreservas.xyz). Quando presente:
   *  - panelCode vira o número de reserva exposto ao cliente (NTR-...)
   *  - panelQrDataUri renderiza o QR de embarque (value = panelBookingId)
   *  - panelTicketUrl é um link "Ver ticket completo"
   * Quando ausente (painel offline ou falha de sync), fallback pro
   * booking_code próprio do site sem QR.
   */
  panelCode?: string | null;
  panelTicketUrl?: string | null;
  panelQrDataUri?: string | null;
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

  // Painel Nautitour é a fonte de verdade pra cliente quando disponível.
  // Fallback graceful: se sync falhou, usa booking_code do site (sem QR).
  const displayCode = p.panelCode?.trim() || p.bookingCode;
  const safeCode = escapeHtml(displayCode);
  const bookingUrl = `${p.siteUrl.replace(/\/$/, '')}/reserva/${encodeURIComponent(p.bookingCode)}`;

  const subject = `Reserva confirmada — ${displayCode}`;

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
              ${p.panelQrDataUri ? renderQrBlock(p.panelQrDataUri, p.panelTicketUrl ?? null) : ''}
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

              ${p.pier ? renderPierBlock(p.pier, p.passengerCount) : ''}
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
              Nautitour · Passeios de barco em Armação dos Búzios
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textParts = [
    `Olá, ${p.customerName || 'Cliente'}!`,
    '',
    'Recebemos seu pagamento. Sua reserva está confirmada.',
    '',
    `Código da reserva: ${displayCode}`,
    `Tour: ${p.tourName}`,
    `Saída: ${departure}`,
    `Passageiros: ${p.passengerCount}`,
    `Total pago: ${total}`,
  ];

  if (p.pier) {
    textParts.push('');
    textParts.push(`Local de embarque: ${p.pier.name}`);
    if (p.pier.address) textParts.push(p.pier.address);
    if (p.pier.feeCents > 0) {
      const fee = (p.pier.feeCents / 100).toFixed(2).replace('.', ',');
      const totalFee = ((p.pier.feeCents * p.passengerCount) / 100)
        .toFixed(2)
        .replace('.', ',');
      textParts.push(
        `ATENÇÃO: taxa de embarque R$ ${fee} por pessoa (total R$ ${totalFee} para ${p.passengerCount} pax) paga PRESENCIALMENTE na loja no dia do passeio. Não é cobrada no site.`
      );
    } else {
      textParts.push('Sem taxa de embarque adicional.');
    }
  }

  textParts.push('');
  textParts.push(`Detalhes: ${bookingUrl}`);
  if (p.panelTicketUrl) {
    textParts.push(`Ticket completo (PDF): ${p.panelTicketUrl}`);
  }
  if (p.panelQrDataUri) {
    textParts.push('Apresente o QR code anexo no embarque.');
  }
  textParts.push('');
  textParts.push('Nautitour — Armação dos Búzios');

  const text = textParts.join('\n');

  return { subject, html, text };
}

function renderQrBlock(qrDataUri: string, ticketUrl: string | null): string {
  const ticketCta = ticketUrl
    ? `<p style="margin:12px 0 0;font-size:13px;">
         <a href="${ticketUrl}" style="color:#096EAB;text-decoration:underline;font-weight:bold;">Baixar ticket completo (PDF)</a>
       </p>`
    : '';
  return `
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;text-align:center;margin:16px 0;">
      <p style="margin:0 0 12px;font-size:13px;color:#555;">Apresente este QR code no embarque</p>
      <img src="${qrDataUri}" alt="QR code de embarque" width="180" height="180" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;height:180px;width:180px;" />
      ${ticketCta}
    </div>`;
}

function renderPierBlock(
  pier: { name: string; address: string | null; feeCents: number },
  passengerCount: number
): string {
  const safeName = escapeHtml(pier.name);
  const safeAddr = pier.address ? escapeHtml(pier.address) : '';
  const isPaid = pier.feeCents > 0;
  const bg = isPaid ? '#fffbeb' : '#ecfdf5';
  const border = isPaid ? '#fcd34d' : '#86efac';
  const accent = isPaid ? '#92400e' : '#065f46';

  let feeBlock = '';
  if (isPaid) {
    const fee = (pier.feeCents / 100).toFixed(2).replace('.', ',');
    const totalFee = ((pier.feeCents * passengerCount) / 100)
      .toFixed(2)
      .replace('.', ',');
    feeBlock = `
      <p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:${accent};">
        ⚠️ <strong>Taxa de embarque R$ ${fee} por pessoa</strong> paga presencialmente na loja no dia do passeio (não é cobrada no site).<br>
        Total para ${passengerCount} ${passengerCount === 1 ? 'pessoa' : 'pessoas'}: <strong>R$ ${totalFee}</strong>
      </p>`;
  } else {
    feeBlock = `<p style="margin:8px 0 0;font-size:13px;color:${accent};">Sem taxa de embarque adicional.</p>`;
  }

  return `
    <div style="background:${bg};border:1px solid ${border};border-radius:6px;padding:14px 16px;margin:16px 0;">
      <p style="margin:0;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;color:#555;">Local de embarque</p>
      <p style="margin:4px 0 0;font-size:15px;font-weight:bold;color:#1a1a1a;">${safeName}</p>
      ${safeAddr ? `<p style="margin:2px 0 0;font-size:13px;color:#555;">${safeAddr}</p>` : ''}
      ${feeBlock}
    </div>`;
}
