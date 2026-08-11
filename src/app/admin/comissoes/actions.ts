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

const RECEIPT_MIMES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

/**
 * Anexa o comprovante do pagamento da comissão (1 por payout). Bucket
 * PRIVADO commission-receipts — visualização só via URL assinada.
 */
export async function uploadPayoutReceiptAction(
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/comissoes');
  if (!(await isAdminUser(user.id))) return { ok: false, error: 'Sem permissão' };

  const payoutId = String(formData.get('payoutId') ?? '');
  const file = formData.get('file');
  if (!payoutId || !(file instanceof File)) {
    return { ok: false, error: 'Arquivo ou payout ausente' };
  }
  const ext = RECEIPT_MIMES[file.type];
  if (!ext) return { ok: false, error: 'Formato inválido (use foto ou PDF)' };
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: 'Arquivo grande demais (máx 10MB)' };
  }

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient();

  const { data: payout } = await admin
    .from('seller_payouts')
    .select('id')
    .eq('id', payoutId)
    .maybeSingle();
  if (!payout) return { ok: false, error: 'Payout não encontrado' };

  const path = `${payoutId}/${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await admin.storage
    .from('commission-receipts')
    .upload(path, bytes, { contentType: file.type, cacheControl: '31536000' });
  if (upErr) return { ok: false, error: `Upload falhou: ${upErr.message}` };

  const { error: dbErr } = await admin
    .from('seller_payouts')
    .update({ receipt_path: path })
    .eq('id', payoutId);
  if (dbErr) return { ok: false, error: dbErr.message };

  revalidatePath('/admin/comissoes');
  return { ok: true };
}

/** URL assinada (5 min) pra abrir o comprovante — o bucket é privado. */
export async function getReceiptUrlAction(
  payoutId: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/comissoes');
  if (!(await isAdminUser(user.id))) return { ok: false, error: 'Sem permissão' };

  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient();
  const { data: payout } = await admin
    .from('seller_payouts')
    .select('receipt_path')
    .eq('id', payoutId)
    .maybeSingle();
  if (!payout?.receipt_path) return { ok: false, error: 'Sem comprovante anexado' };

  const { data, error } = await admin.storage
    .from('commission-receipts')
    .createSignedUrl(payout.receipt_path, 300);
  if (error || !data?.signedUrl) {
    return { ok: false, error: error?.message ?? 'Falha ao gerar URL' };
  }
  return { ok: true, url: data.signedUrl };
}
