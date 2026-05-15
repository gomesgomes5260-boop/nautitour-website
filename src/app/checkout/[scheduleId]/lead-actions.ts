'use server';

import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { leadCaptureLimiter, getClientIp } from '@/lib/rate-limit';

// Validação simples de email (mesma heurística da RPC pra falhar cedo no
// client antes de bater no servidor). Não cobre 100% RFC mas filtra typos.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type CaptureLeadInput = {
  email: string;
  fullName?: string;
  phone?: string;
  source?: string;
};

export type CaptureLeadResult =
  | { ok: true; wasNew: boolean }
  | { ok: false; error: 'invalid_email' | 'rate_limit' | 'server_error' };

// Captura email de visitante em checkout abandonado pra envio futuro de
// "complete sua reserva". Best-effort, fire-and-forget — client não bloqueia
// o submit principal nem mostra feedback ao usuário.
//
// Usa createAdminClient (service_role) porque a RPC é SECURITY DEFINER e o
// fluxo é anon-callable, mas chamamos do server pra centralizar rate limit.
export async function captureLeadAction(
  input: CaptureLeadInput
): Promise<CaptureLeadResult> {
  const email = (input.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length < 5 || email.length > 254) {
    return { ok: false, error: 'invalid_email' };
  }

  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  const limit = await leadCaptureLimiter.limit(`ip:${ip}`);
  if (!limit.success) {
    return { ok: false, error: 'rate_limit' };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('create_lead_invitation', {
      p_email: email,
      p_full_name: input.fullName?.trim() || undefined,
      p_phone: input.phone?.trim() || undefined,
      p_source: input.source ?? 'checkout_abandon',
    });
    if (error) {
      console.error('[captureLeadAction] rpc error', error);
      return { ok: false, error: 'server_error' };
    }
    const row = Array.isArray(data) ? data[0] : null;
    return { ok: true, wasNew: row?.was_new ?? false };
  } catch (err) {
    console.error('[captureLeadAction] unexpected', err);
    return { ok: false, error: 'server_error' };
  }
}
