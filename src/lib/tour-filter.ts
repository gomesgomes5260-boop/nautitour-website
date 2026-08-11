import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Filtro escuna × lancha das telas do admin (Reservas/Requerimentos):
 * 'lancha' = tours tour_type 'private'; 'escuna' = o resto. Retorna null
 * quando o filtro não se aplica (mostrar tudo).
 */
export async function tourIdsForKind(
  admin: ReturnType<typeof createAdminClient>,
  kind: string | undefined
): Promise<string[] | null> {
  if (kind !== 'escuna' && kind !== 'lancha') return null;
  const { data: tours } = await admin.from('tours').select('id, tour_type');
  return (tours ?? [])
    .filter((t) => (kind === 'lancha' ? t.tour_type === 'private' : t.tour_type !== 'private'))
    .map((t) => t.id);
}
