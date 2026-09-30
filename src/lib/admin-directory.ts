import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

// Rótulo curto de operador pra telas do admin (quem fez check-in, quem
// alterou píer, etc): parte local do e-mail ("kaline.bz"). A view
// admins_with_email só tem admins ATUAIS — um ex-admin cai no fallback
// com o começo do uuid, pra não perder o rastro.
export async function getAdminLabels(
  admin: SupabaseClient<Database>,
  userIds: Array<string | null | undefined>
): Promise<Map<string, string>> {
  const ids = [...new Set(userIds.filter((id): id is string => !!id))];
  const map = new Map<string, string>();
  if (ids.length === 0) return map;

  const { data, error } = await admin
    .from('admins_with_email')
    .select('user_id, email')
    .in('user_id', ids);
  if (error) {
    console.error('[admin-directory] erro ao carregar admins_with_email', error);
  }
  for (const r of data ?? []) {
    if (r.user_id && r.email) map.set(r.user_id, r.email.split('@')[0]);
  }
  for (const id of ids) {
    if (!map.has(id)) map.set(id, `ex-admin ${id.slice(0, 8)}`);
  }
  return map;
}
