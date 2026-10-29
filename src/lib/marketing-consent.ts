import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

export type MarketingConsentSource = 'checkout' | 'signup' | 'admin';

/**
 * Registra o opt-in/opt-out de e-mail marketing do cliente (LGPD, art. 7º I).
 * Best-effort: nunca deve quebrar o fluxo principal (reserva/cadastro) — o
 * caller trata o retorno `false` como "não registrou" e segue.
 *
 * A RPC é SECURITY DEFINER sem grant pra anon/authenticated: só o service
 * role (server actions) consegue chamar. Cria o cliente como guest se ainda
 * não existir (ex.: cadastro com confirmação de e-mail pendente).
 */
export async function recordMarketingConsent(
  email: string,
  optIn: boolean,
  source: MarketingConsentSource
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc('record_marketing_consent', {
      p_email: email.trim().toLowerCase(),
      p_opt_in: optIn,
      p_source: source,
    });
    if (error) {
      console.error('[marketing-consent] rpc error', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[marketing-consent] unexpected', err);
    return false;
  }
}

/**
 * Descadastro por token (link do rodapé dos e-mails promocionais).
 * Retorna o e-mail mascarado (ex.: "g***@gmail.com") ou null se o token
 * não existe. Idempotente — clicar duas vezes não dá erro.
 */
export async function unsubscribeByToken(token: string): Promise<string | null> {
  if (!UUID_RE.test(token)) return null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('marketing_unsubscribe', {
      p_token: token,
    });
    if (error) {
      console.error('[marketing-consent] unsubscribe error', error);
      return null;
    }
    return typeof data === 'string' && data.length > 0 ? data : null;
  } catch (err) {
    console.error('[marketing-consent] unsubscribe unexpected', err);
    return null;
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** URL absoluta de descadastro pra colocar no rodapé de e-mails promocionais. */
export function buildUnsubscribeUrl(siteUrl: string, unsubscribeToken: string): string {
  return `${siteUrl.replace(/\/$/, '')}/descadastrar?t=${encodeURIComponent(unsubscribeToken)}`;
}
