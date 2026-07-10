import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

// Vendedores/agências vivem na tabela `sellers`, separada de `admins` de
// propósito: is_admin()/isAdminUser() gateiam o painel inteiro e não devem
// ganhar callers novos. Este módulo só LÊ papéis; gates de admin continuam
// em src/lib/admin.ts.

export type StaffRole = 'owner' | 'admin' | 'agency' | 'seller';

export type Seller = {
  id: string;
  user_id: string;
  role: 'agency' | 'seller';
  agency_id: string | null;
  full_name: string;
  phone: string | null;
  neto_value_cents: number;
  pix_key: string | null;
  active: boolean;
};

export async function getSellerForUser(userId: string): Promise<Seller | null> {
  if (!userId) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('sellers')
    .select(
      'id, user_id, role, agency_id, full_name, phone, neto_value_cents, pix_key, active'
    )
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle();
  if (error) {
    console.error('[staff] getSellerForUser query error', error);
    return null;
  }
  return (data as Seller | null) ?? null;
}

/**
 * Papel do usuário na hierarquia owner > admin > agency > seller.
 * `admins` tem precedência sobre `sellers` (um admin que por acaso
 * esteja em sellers é tratado como admin).
 */
export async function getUserRole(userId: string): Promise<StaffRole | null> {
  if (!userId) return null;
  const admin = createAdminClient();

  const { data: adminRow, error: adminErr } = await admin
    .from('admins')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  if (adminErr) {
    console.error('[staff] getUserRole admins query error', adminErr);
    return null;
  }
  if (adminRow) return adminRow.role === 'owner' ? 'owner' : 'admin';

  const seller = await getSellerForUser(userId);
  return seller ? seller.role : null;
}
