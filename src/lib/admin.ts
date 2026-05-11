import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

export async function isAdminUser(userId: string): Promise<boolean> {
  if (!userId) return false;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('[admin] isAdminUser query error', error);
    return false;
  }
  return Boolean(data);
}
