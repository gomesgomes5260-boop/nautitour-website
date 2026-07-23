'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { bookingLimiter, getClientIp } from '@/lib/rate-limit';

export type SellerBookingInput = {
  scheduleId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  passengers: Array<{ full_name: string; is_child: boolean }>;
  amountPaidCents: number;
  manualPaymentMethod: 'pix' | 'cash' | 'credit_card' | 'debit_card';
  needsPickup: boolean;
  pickupAddress: string | null;
  pickupRoom: string | null;
  notes: string | null;
};

export async function createSellerBookingAction(
  input: SellerBookingInput
): Promise<
  { ok: true; bookingCode: string; totalCents: number } | { ok: false; error: string }
> {
  const ip = getClientIp(await headers());
  const limit = await bookingLimiter.limit(`ip:${ip}`);
  if (!limit.success) {
    return { ok: false, error: 'Muitas reservas em sequência. Aguarde um momento.' };
  }

  if (!input.scheduleId) return { ok: false, error: 'Escolha uma saída.' };
  if (input.customerName.trim().length < 3) {
    return { ok: false, error: 'Informe o nome do cliente.' };
  }
  if (input.customerPhone.trim().length < 8) {
    return { ok: false, error: 'Informe o telefone do cliente.' };
  }
  const passengers = input.passengers
    .map((p) => ({ full_name: p.full_name.trim(), is_child: !!p.is_child }))
    .filter((p) => p.full_name.length > 0);
  if (passengers.length === 0) {
    return { ok: false, error: 'Informe pelo menos um passageiro.' };
  }
  if (!Number.isInteger(input.amountPaidCents) || input.amountPaidCents < 0) {
    return { ok: false, error: 'Sinal inválido.' };
  }

  // Client user-scoped: a RPC valida is_seller(auth.uid()) por dentro.
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('seller_create_booking', {
    p_schedule_id: input.scheduleId,
    p_customer_name: input.customerName.trim(),
    p_customer_phone: input.customerPhone.trim(),
    p_customer_email: input.customerEmail?.trim() || undefined,
    p_passengers: passengers,
    p_amount_paid_cents: input.amountPaidCents,
    p_manual_payment_method: input.manualPaymentMethod,
    p_needs_pickup: input.needsPickup,
    p_pickup_address: input.pickupAddress?.trim() || undefined,
    p_pickup_room: input.pickupRoom?.trim() || undefined,
    p_notes: input.notes?.trim() || undefined,
  });
  if (error) {
    console.error('[createSellerBookingAction]', error);
    const msg = error.message.includes('not enough seats')
      ? 'Não há vagas suficientes nessa saída.'
      : error.message.includes('sold_out')
        ? 'Essa saída está esgotada.'
        : error.message.includes('not a seller')
          ? 'Sua conta não está habilitada como vendedor.'
          : error.message;
    return { ok: false, error: msg };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, error: 'Falha ao criar reserva.' };

  // Aviso interno (reservas@) — reserva manual de vendedor também conta pra
  // equipe se preparar. Best-effort, nunca desfaz a reserva.
  try {
    const [{ notifyTeam, formatPriceCents }, { getSellerForUser }] =
      await Promise.all([import('@/lib/team-notify'), import('@/lib/staff')]);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const seller = user ? await getSellerForUser(user.id) : null;
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://nautitour-website.vercel.app';
    await notifyTeam(
      `Nova reserva de vendedor — ${row.booking_code}`,
      [
        ['Código', row.booking_code],
        ['Vendedor', seller?.full_name],
        ['Cliente', input.customerName.trim()],
        ['Telefone', input.customerPhone.trim()],
        ['Passageiros', String(passengers.length)],
        ['Total', formatPriceCents(row.total_cents)],
        ['Sinal pago', formatPriceCents(input.amountPaidCents)],
        ['Pickup', input.needsPickup ? (input.pickupAddress?.trim() || 'Sim') : null],
      ],
      `${siteUrl.replace(/\/$/, '')}/admin/reservas/${encodeURIComponent(row.booking_code)}`
    );
  } catch (err) {
    console.error('[createSellerBookingAction] team notify', err);
  }

  return { ok: true, bookingCode: row.booking_code, totalCents: row.total_cents };
}
