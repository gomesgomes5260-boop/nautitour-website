export type BookingReminderPayload = {
  bookingCode: string;
  customerName: string;
  tourName: string;
  departureAt: string;
  passengerCount: number;
  siteUrl: string;
  pier?: {
    name: string;
    address: string | null;
    feeCents: number;
  } | null;
  ticketUrl: string;
};

function formatDeparture(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    }),
    time: d.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderBookingReminder(p: BookingReminderPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const { date, time } = formatDeparture(p.departureAt);
  const safeName = escapeHtml(p.customerName || 'Cliente');
  const safeTour = escapeHtml(p.tourName);
  const safeDate = escapeHtml(date);

  const subject = `Seu passeio é amanhã! — ${p.bookingCode}`;

  let pierHtml = '';
  let pierText: string[] = [];
  if (p.pier) {
    const safePierName = escapeHtml(p.pier.name);
    const safeAddr = p.pier.address ? escapeHtml(p.pier.address) : '';
    const feeNote =
      p.pier.feeCents > 0
        ? `<p style="margin:8px 0 0;font-size:13px;color:#92400e;">⚠️ Taxa de embarque de R$ ${(p.pier.feeCents / 100)
            .toFixed(2)
            .replace('.', ',')} por pessoa, paga presencialmente na loja.</p>`
        : '';
    pierHtml = `
      <div style="background:#f0f9ff;border:1px solid #096EAB;border-radius:6px;padding:14px 16px;margin:16px 0;">
        <p style="margin:0;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;color:#555;">Local de embarque</p>
        <p style="margin:4px 0 0;font-size:15px;font-weight:bold;">${safePierName}</p>
        ${safeAddr ? `<p style="margin:2px 0 0;font-size:13px;color:#555;">${safeAddr}</p>` : ''}
        ${feeNote}
      </div>`;
    pierText = [
      `Embarque: ${p.pier.name}`,
      ...(p.pier.address ? [p.pier.address] : []),
      ...(p.pier.feeCents > 0
        ? [
            `Taxa de embarque R$ ${(p.pier.feeCents / 100).toFixed(2).replace('.', ',')}/pessoa paga presencialmente.`,
          ]
        : []),
    ];
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
        <tr>
          <td style="background:#096EAB;padding:24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;">Nautitour</h1>
            <p style="margin:8px 0 0;color:#cce7f5;font-size:14px;">Lembrete: seu passeio é amanhã!</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <p style="margin:0 0 16px;font-size:16px;">Olá, ${safeName}!</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
              Passando pra lembrar do seu passeio <strong>${safeTour}</strong>:
            </p>
            <div style="background:#f0f9ff;border:1px solid #096EAB;border-radius:6px;padding:16px;text-align:center;margin:16px 0;">
              <p style="margin:0;font-size:15px;text-transform:capitalize;"><strong>${safeDate}</strong></p>
              <p style="margin:6px 0 0;font-size:24px;font-weight:bold;color:#D90006;">${time}</p>
              <p style="margin:6px 0 0;font-size:13px;color:#555;">${p.passengerCount} passageiro${p.passengerCount === 1 ? '' : 's'} · código ${escapeHtml(p.bookingCode)}</p>
            </div>
            ${pierHtml}
            <p style="margin:16px 0 8px;font-size:14px;line-height:1.5;">
              Chegue com <strong>30 minutos de antecedência</strong> e apresente o QR code do seu ticket no embarque.
            </p>
            <p style="margin:24px 0 8px;font-size:14px;">
              <a href="${p.ticketUrl}" style="background:#096EAB;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Ver ticket de embarque</a>
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
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Olá, ${p.customerName || 'Cliente'}!`,
    '',
    `Lembrete: seu passeio ${p.tourName} é amanhã!`,
    '',
    `Data: ${date}`,
    `Horário: ${time}`,
    `Passageiros: ${p.passengerCount}`,
    `Código: ${p.bookingCode}`,
    ...(pierText.length ? ['', ...pierText] : []),
    '',
    'Chegue com 30 minutos de antecedência e apresente o QR code do ticket no embarque.',
    `Ticket: ${p.ticketUrl}`,
    '',
    'Nautitour — Armação dos Búzios',
  ].join('\n');

  return { subject, html, text };
}
