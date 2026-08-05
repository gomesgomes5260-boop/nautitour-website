'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin';
import { refundCharge } from '@/lib/pagarme/client';

async function requireAdminAuthenticated() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/reservas');
  const ok = await isAdminUser(user.id);
  if (!ok) throw new Error('Sem permissão');
  return { supabase, user };
}

export async function cancelBookingAction(
  bookingCode: string,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await requireAdminAuthenticated();

  // Buscar booking_id (a RPC opera por id, a UI opera por code).
  const admin = createAdminClient();
  const { data: booking, error: fetchErr } = await admin
    .from('bookings')
    .select('id, status')
    .eq('booking_code', bookingCode)
    .maybeSingle();
  if (fetchErr) {
    console.error('[cancelBookingAction] fetch', fetchErr);
    return { ok: false, error: fetchErr.message };
  }
  if (!booking) return { ok: false, error: 'Reserva não encontrada' };

  const { error } = await supabase.rpc('admin_cancel_booking', {
    p_booking_id: booking.id,
    p_reason: reason,
  });
  if (error) {
    console.error('[cancelBookingAction] rpc', error);
    return { ok: false, error: error.message };
  }

  // Avisa o cliente — best-effort, nunca desfaz o cancelamento. Antes o
  // cancelamento pelo admin era silencioso (só o feito pelo cliente enviava).
  const { sendBookingCancelledEmail } = await import('@/lib/booking-emails');
  await sendBookingCancelledEmail(admin, booking.id).catch((e) =>
    console.error('[cancelBookingAction] email', e)
  );

  revalidatePath('/admin/reservas');
  revalidatePath(`/admin/reservas/${bookingCode}`);
  return { ok: true };
}

export async function attemptRefundAction(
  bookingCode: string,
  amountCents?: number
): Promise<
  | { ok: true; refundedAt: string }
  | { ok: false; error: string }
> {
  const { supabase } = await requireAdminAuthenticated();
  const admin = createAdminClient();

  // Carrega payment 'paid' mais recente desse booking
  const { data: booking } = await admin
    .from('bookings')
    .select('id, status')
    .eq('booking_code', bookingCode)
    .maybeSingle();
  if (!booking) return { ok: false, error: 'Reserva não encontrada' };

  const { data: payment } = await admin
    .from('payments')
    .select('pagarme_charge_id, status, amount_cents, payment_method')
    .eq('booking_id', booking.id)
    .eq('status', 'paid')
    .order('paid_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!payment || !payment.pagarme_charge_id) {
    return { ok: false, error: 'Não há pagamento pago elegível pra reembolso.' };
  }

  if (amountCents !== undefined) {
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      return { ok: false, error: 'Valor de reembolso inválido.' };
    }
    if (amountCents > payment.amount_cents) {
      const total = (payment.amount_cents / 100)
        .toFixed(2)
        .replace('.', ',');
      return {
        ok: false,
        error: `Valor excede o total pago de R$ ${total}.`,
      };
    }
  }

  // Chama Pagar.me (amountCents undefined = refund total)
  const result = await refundCharge(payment.pagarme_charge_id, amountCents);

  // Loga o resultado via RPC (com auth.uid())
  const { error: rpcErr } = await supabase.rpc('admin_mark_refund_attempt', {
    p_booking_id: booking.id,
    p_charge_id: payment.pagarme_charge_id,
    p_ok: result.ok,
    p_response: (result.raw ?? null) as never,
  });
  if (rpcErr) {
    console.error('[attemptRefundAction] mark_refund_attempt error', rpcErr);
    return { ok: false, error: `Falha ao registrar: ${rpcErr.message}` };
  }

  revalidatePath(`/admin/reservas/${bookingCode}`);
  revalidatePath('/admin/reservas');

  if (!result.ok) {
    return {
      ok: false,
      error: `Pagar.me recusou: ${result.error}. Faça manual no painel.`,
    };
  }

  // Avisa o cliente do estorno (total ou parcial) — best-effort.
  const { sendBookingRefundedEmail } = await import('@/lib/booking-emails');
  await sendBookingRefundedEmail(admin, booking.id, {
    amountRefundedCents: amountCents ?? payment.amount_cents,
    totalPaidCents: payment.amount_cents,
    paymentMethod: payment.payment_method,
  }).catch((e) => console.error('[attemptRefundAction] email', e));

  return { ok: true, refundedAt: new Date().toISOString() };
}

export async function resendConfirmationEmailAction(
  bookingCode: string
): Promise<{ ok: true } | { ok: false; error: string; skipped?: boolean }> {
  await requireAdminAuthenticated();
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('id, status')
    .eq('booking_code', bookingCode)
    .maybeSingle();
  if (!booking) return { ok: false, error: 'Reserva não encontrada' };
  if (booking.status !== 'confirmed') {
    return {
      ok: false,
      error: `Só reservas confirmadas podem reenviar e-mail (status atual: ${booking.status})`,
    };
  }

  // Import dinâmico — evita carregar Resend SDK em outras paths admin.
  // notifyTeam: false — reenvio manual não é reserva nova, não avisa a equipe.
  const { sendBookingConfirmationFor } = await import('@/lib/email-flow');
  const res = await sendBookingConfirmationFor(admin, booking.id, { notifyTeam: false });

  if (!res.ok) {
    if ('skipped' in res && res.skipped) {
      return { ok: false, error: 'RESEND_API_KEY ausente em prod.', skipped: true };
    }
    return { ok: false, error: 'error' in res ? res.error : 'falha desconhecida' };
  }

  // Loga evento
  await admin.from('booking_events').insert({
    booking_id: booking.id,
    kind: 'email_resent',
    payload: { trigger: 'admin' },
  });

  revalidatePath(`/admin/reservas/${bookingCode}`);
  return { ok: true };
}
