'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin';
import { markPayoutPaid } from '@/lib/seller-payout';

export async function markPayoutPaidAction(
  payoutId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!payoutId) return { ok: false, error: 'Payout inválido' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/comissoes');
  if (!(await isAdminUser(user.id))) return { ok: false, error: 'Sem permissão' };

  const result = await markPayoutPaid(payoutId, user.id);
  revalidatePath('/admin/comissoes');
  return result;
}
