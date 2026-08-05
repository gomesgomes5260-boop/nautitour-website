export type BookingReviewRequestPayload = {
  bookingCode: string;
  customerName: string;
  tourName: string;
  /** Link direto de avaliação do Google (perfil da empresa). */
  reviewUrl: string;
  siteUrl: string;
  waUrl: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Pós-passeio (D+1): agradece e pede avaliação no Google. Categoria
 * positiva → header verde, mesmo tom do booking-confirmation.
 */
export function renderBookingReviewRequest(p: BookingReviewRequestPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const safeName = escapeHtml(p.customerName || 'Cliente');
  const safeTour = escapeHtml(p.tourName);
  const site = p.siteUrl.replace(/\/$/, '');

  const subject = 'Como foi seu passeio? Conta pra gente ⭐';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
        <tr>
          <td style="background:#059669;padding:24px;text-align:center;">
            <img src="${site}/brand/logo-white.png" alt="Nautitour" width="60" height="44" style="display:block;margin:0 auto;border:0;outline:none;" />
            <p style="margin:10px 0 0;color:#d1fae5;font-size:14px;">Obrigado por navegar com a gente!</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <p style="margin:0 0 16px;font-size:16px;">Olá, ${safeName}!</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
              Esperamos que o seu ${safeTour} tenha sido inesquecível. 🌊
              Foi um prazer receber você a bordo!
            </p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.5;">
              Sua opinião vale ouro pra gente: uma avaliação no Google leva
              menos de 1 minuto e ajuda outros viajantes a conhecerem a
              Nautitour.
            </p>
            <p style="margin:0 0 24px;text-align:center;">
              <a href="${p.reviewUrl}" style="background:#059669;color:#ffffff;padding:14px 28px;border-radius:6px;text-decoration:none;display:inline-block;font-size:16px;font-weight:bold;">⭐ Avaliar no Google</a>
            </p>
            <p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#555;">
              Algo não saiu como esperado? Fala direto com a gente — queremos
              resolver:
            </p>
            <p style="margin:0 0 8px;font-size:14px;">
              <a href="${p.waUrl}" style="color:#096EAB;text-decoration:underline;">Falar no WhatsApp</a>
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
    `Esperamos que o seu ${p.tourName} tenha sido inesquecível. Foi um prazer receber você a bordo!`,
    '',
    'Sua opinião vale ouro: uma avaliação no Google leva menos de 1 minuto e ajuda outros viajantes a conhecerem a Nautitour.',
    '',
    `Avaliar no Google: ${p.reviewUrl}`,
    '',
    `Algo não saiu como esperado? Fale com a gente: ${p.waUrl}`,
    '',
    'Nautitour — Armação dos Búzios',
  ].join('\n');

  return { subject, html, text };
}
