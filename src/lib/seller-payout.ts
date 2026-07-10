import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { createAdminClient } from '@/lib/supabase/admin';
import { calcSellerPayoutCents } from '@/lib/seller-payout-calc';
import { sendPixOut, generateIdEnvio, isEfiConfigured } from '@/lib/efi/client';

type UserClient = SupabaseClient<Database>;

export type PayoutResult =
  | { status: 'sent'; amountCents: number }
  | { status: 'pending'; amountCents: number; reason: string }
  | { status: 'failed'; amountCents: number; error: string }
  | { status: 'skipped'; reason: string };

/**
 * Dispara o payout de comissão após o PRIMEIRO check-in de uma reserva de
 * vendedor. Chame apenas quando admin_check_in_booking retornou
 * first_checkin=true; ainda assim o claim atômico (booking_id UNIQUE +
 * ON CONFLICT DO NOTHING) garante no máximo 1 payout por reserva.
 *
 * `supabase` precisa ser o client user-scoped da sessão do admin — o claim
 * RPC valida is_admin(auth.uid()).
 *
 * NUNCA lança: erro EFÍ vira row 'failed' com retry manual em
 * /admin/comissoes. O check-in jamais é bloqueado por payout.
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

    const logEvent = (kind: string, payload: Record<string, string | number | boolean | null>) =>
      admin
        .from('booking_events')
        .insert({ booking_id: b.id, kind, payload })
        .then(({ error }) => {
          if (error) console.error('[seller-payout] event log error', error);
        });

    if (amountCents <= 0) {
      await admin
        .from('seller_payouts')
        .update({ status: 'skipped', error: 'comissão zero', updated_at: new Date().toISOString() })
        .eq('booking_id', b.id);
      await logEvent('payout_skipped', { reason: 'comissão zero' });
      return { status: 'skipped', reason: 'comissão zero' };
    }

    if (!seller.pix_key || !isEfiConfigured()) {
      const reason = !seller.pix_key
        ? 'vendedor sem chave PIX cadastrada'
        : 'EFÍ não configurado';
      await admin
        .from('seller_payouts')
        .update({ error: reason, updated_at: new Date().toISOString() })
        .eq('booking_id', b.id);
      await logEvent('payout_pending', { reason, amount_cents: amountCents });
      return { status: 'pending', amountCents, reason };
    }

    try {
      const { e2eId } = await sendPixOut({
        pixKey: seller.pix_key,
        amountCents,
        idEnvio: generateIdEnvio(b.booking_code),
      });
      await admin
        .from('seller_payouts')
        .update({
          status: 'sent',
          e2e_id: e2eId,
          error: null,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('booking_id', b.id);
      await logEvent('payout_sent', { amount_cents: amountCents, e2e_id: e2eId });
      return { status: 'sent', amountCents };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[seller-payout] sendPixOut failed', err);
      await admin
        .from('seller_payouts')
        .update({ status: 'failed', error: msg.slice(0, 500), updated_at: new Date().toISOString() })
        .eq('booking_id', b.id);
      await logEvent('payout_failed', { amount_cents: amountCents, error: msg.slice(0, 500) });
      return { status: 'failed', amountCents, error: msg };
    }
  } catch (err) {
    // Barreira final: payout nunca derruba o check-in.
    console.error('[seller-payout] unexpected error', err);
    return { status: 'skipped', reason: 'unexpected error' };
  }
}

/**
 * Retry manual (admin/comissoes) de payout pending/failed. Reusa a row já
 * clamada — não insere nova, então continua impossível duplicar.
 */
export async function retrySellerPayout(payoutId: string): Promise<PayoutResult> {
  const admin = createAdminClient();
  const { data: payout } = await admin
    .from('seller_payouts')
    .select(
      'id, booking_id, seller_id, amount_cents, status, seller:sellers ( pix_key ), booking:bookings ( booking_code )'
    )
    .eq('id', payoutId)
    .maybeSingle();

  if (!payout) return { status: 'skipped', reason: 'payout não encontrado' };

  type Row = {
    id: string;
    booking_id: string;
    seller_id: string;
    amount_cents: number;
    status: string;
    seller: { pix_key: string | null } | { pix_key: string | null }[] | null;
    booking: { booking_code: string } | { booking_code: string }[] | null;
  };
  const p = payout as unknown as Row;
  if (p.status === 'sent') return { status: 'skipped', reason: 'já enviado' };
  if (p.amount_cents <= 0) return { status: 'skipped', reason: 'comissão zero' };

  const seller = Array.isArray(p.seller) ? p.seller[0] : p.seller;
  const booking = Array.isArray(p.booking) ? p.booking[0] : p.booking;
  const pixKey = seller?.pix_key ?? null;

  if (!pixKey) {
    return { status: 'pending', amountCents: p.amount_cents, reason: 'vendedor sem chave PIX' };
  }
  if (!isEfiConfigured()) {
    return { status: 'pending', amountCents: p.amount_cents, reason: 'EFÍ não configurado' };
  }

  try {
    const { e2eId } = await sendPixOut({
      pixKey,
      amountCents: p.amount_cents,
      idEnvio: generateIdEnvio(booking?.booking_code ?? p.booking_id),
    });
    await admin
      .from('seller_payouts')
      .update({
        status: 'sent',
        pix_key: pixKey,
        e2e_id: e2eId,
        error: null,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', p.id);
    await admin.from('booking_events').insert({
      booking_id: p.booking_id,
      kind: 'payout_sent',
      payload: { amount_cents: p.amount_cents, e2e_id: e2eId, retry: true },
    });
    return { status: 'sent', amountCents: p.amount_cents };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await admin
      .from('seller_payouts')
      .update({ status: 'failed', error: msg.slice(0, 500), updated_at: new Date().toISOString() })
      .eq('id', p.id);
    return { status: 'failed', amountCents: p.amount_cents, error: msg };
  }
}
