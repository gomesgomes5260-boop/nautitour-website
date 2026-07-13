import 'server-only';

/**
 * Envio ativo de mensagens via WhatsApp Cloud API (Meta / Graph API).
 * Espelho do contrato de src/lib/email.ts: no-op silencioso sem envs,
 * nunca lança — falha de WhatsApp jamais pode quebrar o fluxo de negócio.
 *
 * Envs (Vercel):
 *   WHATSAPP_ACCESS_TOKEN     — token permanente de system user (Meta Business)
 *   WHATSAPP_PHONE_NUMBER_ID  — id do número no WABA (não é o telefone em si)
 *
 * ── Templates a cadastrar na Meta (categoria UTILITY, idioma pt_BR) ─────────
 * Os nomes/variáveis abaixo são o contrato entre este código e o WhatsApp
 * Manager. Corpo sugerido (a Meta aprova textos transacionais assim):
 *
 * 1. reserva_confirmada — body {{1}}=nome, {{2}}=tour, {{3}}=data/hora,
 *    {{4}}=código; botão de URL dinâmica → https://<site>/ticket/{{1}}
 *    "Olá {{1}}! Sua reserva do {{2}} está confirmada para {{3}}.
 *     Código: {{4}}. Apresente o QR code do ticket no embarque."
 *
 * 2. lembrete_passeio — body {{1}}=nome, {{2}}=tour, {{3}}=data/hora,
 *    {{4}}=código; botão de URL dinâmica → https://<site>/ticket/{{1}}
 *    "Olá {{1}}! Lembrete: seu passeio {{2}} é amanhã, {{3}}. Código {{4}}.
 *     Chegue com 30 minutos de antecedência."
 *
 * 3. reserva_cancelada — body {{1}}=nome, {{2}}=código, {{3}}=tour;
 *    botão de URL fixa → https://<site>/passeio-escuna
 *    "Olá {{1}}! Confirmamos o cancelamento da reserva {{2}} ({{3}}).
 *     Se houve pagamento, nossa equipe processa o estorno."
 *
 * 4. passeio_cancelado — body {{1}}=nome, {{2}}=tour, {{3}}=data/hora,
 *    {{4}}=código; botão de URL fixa → https://<site>/passeio-escuna
 *    "Olá {{1}}! Precisamos cancelar a saída do {{2}} de {{3}} (reserva
 *     {{4}}) por condições climáticas ou determinação da Marinha.
 *     Reagende pelo site ou fale com a gente — você não perde nada."
 */

export type WhatsAppSendResult =
  | { ok: true; id?: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; error: string };

const GRAPH_VERSION = 'v23.0';

export function isWhatsAppCloudConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

export type WhatsAppTemplatePayload = {
  /** Destinatário em E.164 sem "+" (use normalizeBrPhoneE164 antes). */
  to: string;
  /** Nome do template aprovado na Meta (ex.: 'reserva_confirmada'). */
  template: string;
  /** Valores das variáveis {{1}}..{{n}} do body, em ordem. */
  bodyParams: string[];
  /**
   * Sufixo da URL dinâmica do botão (index 0), quando o template tiver
   * botão com variável — ex.: booking_code pra ticket/{{1}}.
   */
  buttonUrlParam?: string;
};

export async function sendWhatsAppTemplate(
  payload: WhatsAppTemplatePayload
): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    console.warn('[whatsapp] envs ausentes — skip envio');
    return {
      ok: false,
      skipped: true,
      reason: 'WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID ausentes',
    };
  }

  const components: Array<Record<string, unknown>> = [];
  if (payload.bodyParams.length > 0) {
    components.push({
      type: 'body',
      parameters: payload.bodyParams.map((text) => ({ type: 'text', text })),
    });
  }
  if (payload.buttonUrlParam !== undefined) {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: payload.buttonUrlParam }],
    });
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: payload.to,
          type: 'template',
          template: {
            name: payload.template,
            language: { code: 'pt_BR' },
            components,
          },
        }),
      }
    );

    const data = (await res.json().catch(() => null)) as {
      messages?: Array<{ id?: string }>;
      error?: { message?: string; code?: number };
    } | null;

    if (!res.ok || data?.error) {
      const msg =
        data?.error?.message ?? `HTTP ${res.status} da Graph API`;
      console.error('[whatsapp] erro da API', {
        template: payload.template,
        status: res.status,
        error: data?.error,
      });
      return { ok: false, error: msg };
    }

    return { ok: true, id: data?.messages?.[0]?.id };
  } catch (err) {
    console.error('[whatsapp] throw', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
