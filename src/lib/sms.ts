import 'server-only';
import { normalizeBrPhoneE164 } from '@/lib/whatsapp';

/**
 * Envio de SMS transacional via Comtele (https://docs.comtele.com.br).
 * Decisão 16/jul: SMS substitui o WhatsApp Cloud API como canal ativo de
 * notificação (atualizações + lembretes) — a Meta travou o onboarding do
 * número. O módulo whatsapp-cloud.ts fica adormecido (sem custo) caso o
 * canal WhatsApp seja retomado no futuro.
 *
 * Mesmo contrato do email.ts/whatsapp-cloud.ts: no-op silencioso sem env,
 * nunca lança — falha de SMS jamais quebra o fluxo de negócio.
 *
 * Env (Vercel): COMTELE_API_KEY (auth-key do painel Comtele).
 */

export type SmsSendResult =
  | { ok: true; id?: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; error: string };

const COMTELE_ENDPOINT = 'https://sms.comtele.com.br/api/v2/send';

export function isSmsConfigured(): boolean {
  return Boolean(process.env.COMTELE_API_KEY);
}

/**
 * Comtele espera número nacional (DDD + número). Aceita entrada em
 * qualquer formato BR via normalizeBrPhoneE164 e remove o 55.
 * Retorna null se o telefone for inválido (caller pula o envio).
 */
export function toSmsReceiver(rawPhone: string | null | undefined): string | null {
  const e164 = normalizeBrPhoneE164(rawPhone);
  if (!e164) return null;
  return e164.slice(2);
}

export async function sendSms(payload: {
  to: string; // receiver nacional (use toSmsReceiver antes)
  content: string;
}): Promise<SmsSendResult> {
  const key = process.env.COMTELE_API_KEY;
  if (!key) {
    console.warn('[sms] COMTELE_API_KEY ausente — skip envio');
    return { ok: false, skipped: true, reason: 'COMTELE_API_KEY ausente' };
  }

  try {
    const res = await fetch(COMTELE_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'auth-key': key,
      },
      body: JSON.stringify({
        Sender: 'nautitour',
        Receivers: payload.to,
        Content: payload.content,
      }),
    });

    const data = (await res.json().catch(() => null)) as {
      Success?: boolean;
      Message?: string;
      Object?: { requestUniqueId?: string };
    } | null;

    if (!res.ok || !data?.Success) {
      const msg = data?.Message ?? `HTTP ${res.status} da API Comtele`;
      console.error('[sms] erro da API', { status: res.status, message: msg });
      return { ok: false, error: msg };
    }

    return { ok: true, id: data.Object?.requestUniqueId };
  } catch (err) {
    console.error('[sms] throw', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
