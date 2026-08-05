export type BookingRefundedPayload = {
  bookingCode: string;
  customerName: string;
  tourName: string;
  /** Valor efetivamente estornado (pode ser parcial). */
  amountRefundedCents: number;
  /** Total que havia sido pago — pra sinalizar estorno parcial. */
  totalPaidCents: number;
  /** 'pix' | 'credit_card' | outro — muda a explicação do prazo. */
  paymentMethod: string | null;
  siteUrl: string;
  waUrl: string;
};

const PRICE = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function refundTimingNote(method: string | null): string {
  if (method === 'pix') {
    return 'Como o pagamento foi por PIX, o valor volta pra conta de origem em instantes (no máximo algumas horas).';
  }
  if (method === 'credit_card') {
    return 'Como o pagamento foi no cartão, o estorno aparece como crédito na sua fatura — dependendo do banco, na atual ou na próxima.';
  }
  return 'O valor volta pelo mesmo meio de pagamento usado na compra.';
}

/**
 * Aviso de estorno processado pelo admin (total ou parcial). Categoria
 * "cancelamento" → header vermelho, padrão do booking-cancelled.
 */
export function renderBookingRefunded(p: BookingRefundedPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const safeName = escapeHtml(p.customerName || 'Cliente');
  const safeTour = escapeHtml(p.tourName);
  const site = p.siteUrl.replace(/\/$/, '');
  const amount = PRICE.format(p.amountRefundedCents / 100);
  const isPartial = p.amountRefundedCents < p.totalPaidCents;
  const timing = refundTimingNote(p.paymentMethod);

  const subject = `Estorno realizado — ${p.bookingCode}`;

  const partialHtml = isPartial
    ? `<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#92400e;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:12px 14px;">
         Este é um estorno parcial — o total pago na reserva foi ${escapeHtml(PRICE.format(p.totalPaidCents / 100))}.
         Qualquer dúvida sobre o valor, fale com a gente no WhatsApp.
       </p>`
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
            <p style="margin:10px 0 0;color:#ffd6d9;font-size:14px;">Estorno realizado</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <p style="margin:0 0 16px;font-size:16px;">Olá, ${safeName}!</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
              Processamos o estorno de <strong>${escapeHtml(amount)}</strong> da sua reserva
              <strong>${escapeHtml(p.bookingCode)}</strong> — ${safeTour}.
            </p>
            ${partialHtml}
            <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">${escapeHtml(timing)}</p>
            <p style="margin:16px 0;font-size:15px;line-height:1.5;">
              Esperamos te ver no mar numa próxima oportunidade. 🌊
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
    `Processamos o estorno de ${amount} da sua reserva ${p.bookingCode} — ${p.tourName}.`,
    ...(isPartial
      ? ['', `Estorno parcial — o total pago foi ${PRICE.format(p.totalPaidCents / 100)}.`]
      : []),
    '',
    timing,
    '',
    `Reservar outra data: ${site}/passeio-escuna`,
    `WhatsApp: ${p.waUrl}`,
    '',
    'Nautitour — Armação dos Búzios',
  ].join('\n');

  return { subject, html, text };
}
