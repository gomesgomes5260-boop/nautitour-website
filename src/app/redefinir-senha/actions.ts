'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { authLimiter, getClientIp } from '@/lib/rate-limit';

export type ResetPasswordResult = { ok: true } | { ok: false; error: string };

export async function resetPasswordAction(input: {
  password: string;
}): Promise<ResetPasswordResult> {
  const ip = getClientIp(await headers());
  const limit = await authLimiter.limit(`ip:${ip}`);
  if (!limit.success) {
    return { ok: false, error: 'Muitas tentativas. Aguarde alguns minutos.' };
  }

  const supabase = await createClient();

  // The reset link from the email lands on /auth/callback, which exchanges
  // the code for a session. Once the user reaches /redefinir-senha they
  // already have an active session — we just call updateUser.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Sessão expirada. Solicite um novo link.' };
  }

  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error) return { ok: false, error: error.message };

  redirect('/?passwordChanged=1');
}
