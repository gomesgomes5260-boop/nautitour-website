'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type ForgotPasswordResult = { ok: true } | { ok: false; error: string };

export async function forgotPasswordAction(input: {
  email: string;
}): Promise<ForgotPasswordResult> {
  const supabase = await createClient();
  const headersList = await headers();
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
