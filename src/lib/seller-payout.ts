import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { createAdminClient } from '@/lib/supabase/admin';
import { calcSellerPayoutCents } from '@/lib/seller-payout-calc';

type UserClient = SupabaseClient<Database>;

// Pagamento da comissão é MANUAL (decisão de 10/jul): o 1º check-in só
// REGISTRA o valor devido em seller_payouts (status 'pending'); o admin
// paga por fora e marca como pago em /admin/comissoes. O envio automático
// via EFÍ (Pix Saída) foi removido — volta numa PR futura de
// implementações complementares (código no histórico do git, PR #93).

export type PayoutResult =
  | { status: 'pending'; amountCents: number }
  | { status: 'skipped'; reason: string };

/**
 * Registra a comissão devida após o PRIMEIRO check-in de uma reserva de
 * vendedor. Chame apenas quando admin_check_in_booking retornou
 * first_checkin=true; ainda assim o claim atômico (booking_id UNIQUE +
 * ON CONFLICT DO NOTHING) garante no máximo 1 registro por reserva.
 *
 * `supabase` precisa ser o client user-scoped da sessão do admin — o claim
 * RPC valida is_admin(auth.uid()).
 *
 * NUNCA lança: o check-in jamais é bloqueado pelo registro de comissão.
 */
export async function triggerSellerPayout(
  supabase: UserClient,
  bookingId: string
): Promise<PayoutResult> {
  try {
    const admin = createAdminClient();

    const { data: booking } = await admin
      .from('bookings')
      .select(
        `
        id, booking_code, total_cents, amount_paid_cents, seller_id,
        passengers:booking_passengers ( is_child ),
        seller:sellers ( id, full_name, neto_value_cents, pix_key )
        `
      )
      .eq('id', bookingId)
      .maybeSingle();

    if (!booking) return { status: 'skipped', reason: 'booking not found' };

    type Row = {
      id: string;
      booking_code: string;
      total_cents: number;
      amount_paid_cents: number;
      seller_id: string | null;
      passengers: { is_child: boolean }[] | null;
      seller:
        | { id: string; full_name: string; neto_value_cents: number; pix_key: string | null }
        | { id: string; full_name: string; neto_value_cents: number; pix_key: string | null }[]
        | null;
    };
    const b = booking as unknown as Row;
    const seller = Array.isArray(b.seller) ? b.seller[0] : b.seller;

    // Reserva do site (sem vendedor) não tem comissão.
    if (!b.seller_id || !seller) return { status: 'skipped', reason: 'no seller' };

    const childCount = (b.passengers ?? []).filter((p) => p.is_child).length;
    const fullCount = (b.passengers ?? []).length - childCount;
    const amountCents = calcSellerPayoutCents({
      netoValueCents: seller.neto_value_cents,
      fullCount,
      childCount,
      totalCents: b.total_cents,
      amountPaidCents: b.amount_paid_cents,
    });

    // Claim atômico — perdedor da corrida não faz nada.
    const { data: claimed, error: claimErr } = await supabase.rpc('claim_seller_payout', {
      p_booking_id: b.id,
      p_seller_id: seller.id,
      p_amount_cents: amountCents,
      p_pix_key: seller.pix_key ?? undefined,
    });
    if (claimErr) {
      console.error('[seller-payout] claim error', claimErr);
      return { status: 'skipped', reason: 'claim failed' };
    }
    if (!claimed) return { status: 'skipped', reason: 'already claimed' };

    if (amountCents <= 0) {
      await admin
        .from('seller_payouts')
        .update({ status: 'skipped', error: 'comissão zero', updated_at: new Date().toISOString() })
        .eq('booking_id', b.id);
      return { status: 'skipped', reason: 'comissão zero' };
    }

    // Fica 'pending' — pagamento manual pelo admin em /admin/comissoes.
    const { error: evErr } = await admin.from('booking_events').insert({
      booking_id: b.id,
      kind: 'payout_pending',
      payload: { amount_cents: amountCents, manual: true },
    });
    if (evErr) console.error('[seller-payout] event log error', evErr);
    return { status: 'pending', amountCents };
  } catch (err) {
    // Barreira final: registro de comissão nunca derruba o check-in.
    console.error('[seller-payout] unexpected error', err);
    return { status: 'skipped', reason: 'unexpected error' };
  }
}

/**
 * Marca um payout como pago manualmente (transferência feita por fora —
 * PIX do banco, dinheiro etc). Reusa a row clamada; não cria nova.
 */
export async function markPayoutPaid(
  payoutId: string,
  actorUserId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data: payout } = await admin
    .from('seller_payouts')
    .select('id, booking_id, status, amount_cents')
    .eq('id', payoutId)
    .maybeSingle();

  if (!payout) return { ok: false, error: 'Payout não encontrado' };
  if (payout.status === 'sent') return { ok: false, error: 'Já está marcado como pago' };
  if (payout.amount_cents <= 0) return { ok: false, error: 'Comissão zero — nada a pagar' };

  const { error } = await admin
    .from('seller_payouts')
    .update({
      status: 'sent',
      error: null,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', payout.id);
  if (error) {
    console.error('[seller-payout] markPayoutPaid error', error);
    return { ok: false, error: error.message };
  }

  const { error: evErr } = await admin.from('booking_events').insert({
    booking_id: payout.booking_id,
    kind: 'payout_paid_manual',
    actor_user_id: actorUserId,
    payload: { amount_cents: payout.amount_cents },
  });
  if (evErr) console.error('[seller-payout] event log error', evErr);
  return { ok: true };
}
