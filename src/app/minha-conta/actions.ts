'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateProfileAction(input: {
  fullName: string;
  phone: string;
  cpf?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sessão expirada.' };

  const { error } = await supabase
    .from('customers')
    .update({
      full_name: input.fullName.trim(),
      phone: input.phone.trim(),
      cpf: input.cpf?.trim() || null,
    })
    .eq('auth_user_id', user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/minha-conta');
  return { ok: true };
}

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { ok: false, error: 'Sessão expirada.' };

  // Re-authenticate with current password to confirm intent
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: input.currentPassword,
  });
  if (signInError) {
    return { ok: false, error: 'Senha atual incorreta.' };
  }

  const { error } = await supabase.auth.updateUser({ password: input.newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
