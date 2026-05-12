import 'server-only';

// Cloudflare Turnstile server-side verification.
//
// Em dev sem TURNSTILE_SECRET_KEY a verificação retorna ok=true (no-op)
// pra não travar fluxo local. Em prod a env deve estar setada.

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export type TurnstileResult =
  | { ok: true; skipped?: true }
  | { ok: false; error: string };

export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string | null
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // No-op em dev / preview sem env
    console.warn('[turnstile] TURNSTILE_SECRET_KEY ausente — skip verify');
    return { ok: true, skipped: true };
  }
  if (!token || token.length < 4) {
    return { ok: false, error: 'captcha inválido' };
  }

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    });
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (data.success) return { ok: true };
    return {
      ok: false,
      error: `captcha falhou: ${(data['error-codes'] ?? []).join(',') || 'unknown'}`,
    };
  } catch (err) {
    console.error('[turnstile] verify error', err);
    return { ok: false, error: 'captcha indisponível, tente novamente' };
  }
}
