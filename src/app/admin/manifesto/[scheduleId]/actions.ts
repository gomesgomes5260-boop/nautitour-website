'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin';

export type SetPierResult = { ok: true } | { ok: false; error: string };

export async function setPierAction(
  scheduleId: string,
  pierSlug: string
): Promise<SetPierResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/manifesto');
  if (!(await isAdminUser(user.id))) {
    return { ok: false, error: 'Acesso restrito a administradores.' };
  }

  const { error } = await supabase.rpc('admin_set_embarkation_pier', {
    p_schedule_id: scheduleId,
    p_pier_slug: pierSlug,
  });
  if (error) {
    console.error('[setPierAction] rpc error', error);
    return { ok: false, error: error.message };
  }

  revalidatePath(`/admin/manifesto/${scheduleId}`);
  revalidatePath('/admin/manifesto');
  return { ok: true };
}
