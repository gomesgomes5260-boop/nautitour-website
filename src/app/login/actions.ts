'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { safeRedirectPath } from '@/lib/safe-redirect';
import { authLimiter, getClientIp } from '@/lib/rate-limit';

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function loginAction(input: {
  email: string;
  password: string;
  redirectTo?: string;
}): Promise<AuthResult> {
  const headersList = await headers();
  const ip = getClientIp(headersList);
  const limit = await authLimiter.limit(ip);
  if (!limit.success) {
    return { ok: false, error: 'Muitas tentativas de login. Aguarde alguns minutos.' };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });
  if (error) return { ok: false, error: error.message };

  // Vendedor sem destino explícito cai direto no painel dele.
  if (!input.redirectTo && data.user) {
    const { getSellerForUser } = await import('@/lib/staff');
    const seller = await getSellerForUser(data.user.id);
    if (seller) redirect('/vendedor');
  }
  redirect(safeRedirectPath(input.redirectTo));
}
