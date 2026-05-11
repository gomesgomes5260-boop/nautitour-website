'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/config');
  const admin = await isAdminUser(user.id);
  if (!admin) {
    throw new Error('Sem permissão');
  }
  return user;
}

export async function regenerateSchedulesAction(): Promise<
  { ok: true; created: number } | { ok: false; error: string }
> {
  await requireAdmin();
  const c = createAdminClient();
  const { data, error } = await c.rpc('generate_future_schedules', {
    p_days_ahead: 28,
  });
  if (error) {
    console.error('[regenerateSchedulesAction]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/config');
  revalidatePath('/admin/manifesto');
  return { ok: true, created: data ?? 0 };
}

export async function blockScheduleAction(
  scheduleId: string,
  reason: string
): Promise<
  { ok: true; cancelledBookings: number } | { ok: false; error: string }
> {
  if (!scheduleId) return { ok: false, error: 'schedule inválido' };
  if (!reason || reason.trim().length < 3) {
    return { ok: false, error: 'Informe um motivo (pelo menos 3 caracteres).' };
  }
  await requireAdmin();
  const c = createAdminClient();
  const { data, error } = await c.rpc('block_schedule', {
    p_schedule_id: scheduleId,
    p_reason: reason.trim(),
  });
  if (error) {
    console.error('[blockScheduleAction]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/manifesto');
  revalidatePath(`/admin/manifesto/${scheduleId}`);
  return { ok: true, cancelledBookings: data ?? 0 };
}
