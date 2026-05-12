'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { authLimiter, getClientIp } from '@/lib/rate-limit';

export type SignupResult =
  | { ok: true; needsEmailConfirmation: boolean }
  | { ok: false; error: string };

export async function signupAction(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}): Promise<SignupResult> {
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

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        full_name: input.fullName.trim(),
        phone: input.phone.trim(),
      },
      emailRedirectTo: baseUrl ? `${baseUrl}/auth/callback` : undefined,
    },
  });

  if (error) return { ok: false, error: error.message };

  // If email confirmation is enabled in Supabase, session will be null and the user
  // must click the link in the email. Otherwise we have a session right away.
  const needsEmailConfirmation = !data.session;
  if (!needsEmailConfirmation) {
    redirect('/');
  }
  return { ok: true, needsEmailConfirmation };
}
