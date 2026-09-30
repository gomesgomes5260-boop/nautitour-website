// E-mail enviado ao cliente quando o admin altera o píer de embarque de uma
// saída que tem booking ativa (ex.: escala de navios de cruzeiro ocupa o
// píer do centro e o embarque muda pro Porto Veleiro / Pescador).
// Texto aprovado pelo dono em 30/set/2026. O aviso da taxa aparece SEMPRE
// (com valor nos píeres pagos, "sem taxa adicional" no centro).

export type PierChangedPayload = {
  bookingCode: string;
  customerName: string;
  tourName: string;
  departureAt: string | null; // ISO
  passengerCount: number;
  siteUrl: string;
  pier: {
    slug: string;
    name: string;
    address: string | null;
    mapsUrl: string | null;
    feeCents: number;
  };
};

const AMBER = '#B45309';
const AMBER_BG = '#fffbeb';
const AMBER_BORDER = '#fcd34d';

function formatDeparture(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: 'a combinar', time: '' };
  try {
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
  } catch {
    return { date: iso, time: '' };
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

export function renderPierChanged(p: PierChangedPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const { date, time } = formatDeparture(p.departureAt);
  const safeName = escapeHtml(p.customerName || 'Cliente');
  const safeTour = escapeHtml(p.tourName);
  const safeCode = escapeHtml(p.bookingCode);
  const safePierName = escapeHtml(p.pier.name);
  const safeAddr = p.pier.address ? escapeHtml(p.pier.address) : '';
  const site = p.siteUrl.replace(/\/$/, '');
  const ticketUrl = `${site}/ticket/${encodeURIComponent(p.bookingCode)}`;
  const isCentro = p.pier.slug === 'rua-pedras';

  const subject = `Atenção: local de embarque do seu passeio — ${p.bookingCode}`;

  // Frase de contexto: quando o embarque sai do centro é por causa da escala
  // de navios; quando volta pro centro, avisa a normalização.
  const contextHtml = isCentro
    ? `O local de embarque do seu passeio de <strong>${escapeHtml(date)}${time ? ` às ${time}` : ''}</strong> foi atualizado: o embarque <strong>voltou a ser no Píer da Rua das Pedras (centro)</strong>.`
    : `Por conta da escala de navios de cruzeiro em Búzios, o embarque do seu passeio de <strong>${escapeHtml(date)}${time ? ` às ${time}` : ''}</strong> <strong>não será no píer da Rua das Pedras (centro)</strong>.`;
  const contextText = isCentro
    ? `O local de embarque do seu passeio de ${date}${time ? ` às ${time}` : ''} foi atualizado: o embarque voltou a ser no Píer da Rua das Pedras (centro).`
    : `Por conta da escala de navios de cruzeiro em Búzios, o embarque do seu passeio de ${date}${time ? ` às ${time}` : ''} NÃO será no píer da Rua das Pedras (centro).`;

  // Aviso da taxa: sempre presente (pedido do dono).
  const fee = (p.pier.feeCents / 100).toFixed(2).replace('.', ',');
  const totalFee = ((p.pier.feeCents * p.passengerCount) / 100)
    .toFixed(2)
    .replace('.', ',');
  const feeHtml =
    p.pier.feeCents > 0
      ? `<p style="margin:12px 0 0;font-size:13px;color:#92400e;line-height:1.5;">💳 <strong>Taxa de embarque: R$ ${fee} por pessoa</strong> (total R$ ${totalFee} para ${p.passengerCount} pax), paga presencialmente na loja no check-in — não é cobrada no site.</p>`
      : `<p style="margin:12px 0 0;font-size:13px;color:#555;">💳 Sem taxa de embarque adicional.</p>`;
  const feeText =
    p.pier.feeCents > 0
      ? `Taxa de embarque: R$ ${fee} por pessoa (total R$ ${totalFee} para ${p.passengerCount} pax), paga presencialmente na loja no check-in — não é cobrada no site.`
      : 'Sem taxa de embarque adicional.';

  const mapsHtml = p.pier.mapsUrl
    ? `<p style="margin:10px 0 0;"><a href="${p.pier.mapsUrl}" style="color:${AMBER};font-size:13px;font-weight:bold;">📍 Ver local de check-in no mapa</a></p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
        <tr><td style="background:${AMBER};padding:24px;text-align:center;">
          <img src="${site}/brand/logo-white.png" alt="Nautitour" width="60" height="44" style="display:block;margin:0 auto;border:0;outline:none;" />
          <p style="margin:10px 0 0;color:#fde68a;font-size:14px;">⚓ Local de embarque do seu passeio</p>
        </td></tr>
        <tr><td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:16px;">Olá, ${safeName}!</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">
            ${contextHtml}
          </p>
          <p style="margin:0 0 4px;font-size:13px;color:#555;">Reserva <strong>${safeCode}</strong> · ${safeTour}</p>

          <div style="background:${AMBER_BG};border:1px solid ${AMBER_BORDER};border-radius:6px;padding:16px;margin:16px 0;">
            <p style="margin:0;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;color:#92400e;">📍 Local de embarque e check-in</p>
            <p style="margin:6px 0 0;font-size:18px;font-weight:bold;color:#1a1a1a;">${safePierName}</p>
            ${safeAddr ? `<p style="margin:4px 0 0;font-size:13px;color:#555;">${safeAddr}</p>` : ''}
            ${mapsHtml}
            ${feeHtml}
          </div>

          <p style="margin:16px 0 8px;font-size:14px;line-height:1.5;">
            🕐 Chegue com <strong>30 minutos de antecedência</strong> pro check-in e
            apresente o QR code do seu ticket no embarque.
          </p>

          <p style="margin:24px 0 8px;font-size:14px;">
            <a href="${ticketUrl}" style="background:${AMBER};color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Ver meu ticket</a>
          </p>
          <p style="margin:24px 0 0;font-size:13px;color:#555;line-height:1.5;">
            Dúvidas? Responda este e-mail ou fale com a gente pelo WhatsApp. 💬
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
    contextText,
    '',
    `Reserva ${p.bookingCode} · ${p.tourName}`,
    '',
    `LOCAL DE EMBARQUE E CHECK-IN: ${p.pier.name}`,
    ...(p.pier.address ? [p.pier.address] : []),
    ...(p.pier.mapsUrl ? [`Mapa: ${p.pier.mapsUrl}`] : []),
    feeText,
    '',
    'Chegue com 30 minutos de antecedência pro check-in e apresente o QR code do seu ticket no embarque.',
    `Ticket: ${ticketUrl}`,
    '',
    'Dúvidas? Responda este e-mail ou fale com a gente pelo WhatsApp.',
    'Nautitour — Armação dos Búzios',
  ].join('\n');

  return { subject, html, text };
}
