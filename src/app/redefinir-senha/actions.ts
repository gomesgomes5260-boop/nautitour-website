'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type ResetPasswordResult = { ok: true } | { ok: false; error: string };

export async function resetPasswordAction(input: {
  password: string;
}): Promise<ResetPasswordResult> {
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
