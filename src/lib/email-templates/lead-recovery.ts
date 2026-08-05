export type LeadRecoveryPayload = {
  customerName: string;
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
 * Recuperação de checkout abandonado — enviado UMA vez, 1-48h após o
 * visitante deixar o e-mail no checkout sem concluir a reserva. Header
 * charcoal (neutro de marca — não é confirmação nem cancelamento).
 */
export function renderLeadRecovery(p: LeadRecoveryPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const safeName = escapeHtml(p.customerName || '');
  const greeting = safeName ? `Olá, ${safeName}!` : 'Olá!';
  const site = p.siteUrl.replace(/\/$/, '');

  const subject = 'Faltou pouco pra garantir seu passeio em Búzios 🌊';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
        <tr>
          <td style="background:#404040;padding:24px;text-align:center;">
            <img src="${site}/brand/logo-white.png" alt="Nautitour" width="60" height="44" style="display:block;margin:0 auto;border:0;outline:none;" />
            <p style="margin:10px 0 0;color:#d4d4d4;font-size:14px;">Sua reserva ficou pela metade</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <p style="margin:0 0 16px;font-size:16px;">${greeting}</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
              Vimos que você começou uma reserva no site da Nautitour e não
              chegou a concluir. O mar de Búzios continua te esperando — e as
              vagas da escuna costumam voar, principalmente nos fins de semana.
            </p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.5;">
              Leva menos de 2 minutos pra garantir seu lugar: pagamento por
              PIX ou cartão e confirmação na hora.
            </p>
            <p style="margin:0 0 24px;text-align:center;">
              <a href="${site}/passeio-escuna" style="background:#C00010;color:#ffffff;padding:14px 28px;border-radius:6px;text-decoration:none;display:inline-block;font-size:16px;font-weight:bold;">Concluir minha reserva</a>
            </p>
            <p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#555;">
              Ficou com alguma dúvida antes de fechar? A equipe responde
              rapidinho:
            </p>
            <p style="margin:0 0 8px;font-size:14px;">
              <a href="${p.waUrl}" style="color:#096EAB;text-decoration:underline;">Falar no WhatsApp</a>
            </p>
            <p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#999;">
              Você recebeu este e-mail porque informou seu endereço ao iniciar
              uma reserva em nautitour.com.br. Este é um aviso único — não
              enviaremos outros.
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
    greeting.replace(/<[^>]+>/g, ''),
    '',
    'Vimos que você começou uma reserva no site da Nautitour e não chegou a concluir. O mar de Búzios continua te esperando — e as vagas da escuna costumam voar.',
    '',
    `Concluir minha reserva: ${site}/passeio-escuna`,
    `Dúvidas? Fale no WhatsApp: ${p.waUrl}`,
    '',
    'Você recebeu este e-mail porque informou seu endereço ao iniciar uma reserva em nautitour.com.br. Este é um aviso único.',
    '',
    'Nautitour — Armação dos Búzios',
  ].join('\n');

  return { subject, html, text };
}
