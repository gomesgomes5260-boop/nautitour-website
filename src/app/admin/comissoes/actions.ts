'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin';
import { retrySellerPayout } from '@/lib/seller-payout';

export async function retryPayoutAction(
  payoutId: string
): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  if (!payoutId) return { ok: false, error: 'Payout inválido' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/comissoes');
  if (!(await isAdminUser(user.id))) return { ok: false, error: 'Sem permissão' };

  const result = await retrySellerPayout(payoutId);
  revalidatePath('/admin/comissoes');

  if (result.status === 'sent') return { ok: true, status: 'sent' };
  if (result.status === 'failed') return { ok: false, error: result.error };
  if (result.status === 'pending') return { ok: false, error: result.reason };
  return { ok: false, error: result.reason };
}
