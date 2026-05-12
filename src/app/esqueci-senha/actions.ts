'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { authLimiter, getClientIp } from '@/lib/rate-limit';

export type ForgotPasswordResult = { ok: true } | { ok: false; error: string };

export async function forgotPasswordAction(input: {
  email: string;
}): Promise<ForgotPasswordResult> {
  const headersList = await headers();
  const ip = getClientIp(headersList);
  const limit = await authLimiter.limit(ip);
  if (!limit.success) {
    return { ok: false, error: 'Muitas tentativas. Aguarde alguns minutos.' };
  }

  const supabase = await createClient();
  const origin = headersList.get('origin');
  const host = headersList.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const baseUrl = origin ?? (host ? `${protocol}://${host}` : null);

  const { error } = await supabase.auth.resetPasswordForEmail(
    input.email.trim().toLowerCase(),
    {
      redirectTo: baseUrl
        ? `${baseUrl}/auth/callback?next=/redefinir-senha`
        : undefined,
    }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
