'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/scan');
  if (!(await isAdminUser(user.id))) {
    throw new Error('Sem permissão');
  }
  return { supabase, user };
}

export type ScannedBooking = {
  bookingCode: string;
  status: string;
  customerName: string | null;
  departureAt: string | null;
  passengerCount: number;
  childCount: number;
  totalCents: number;
  paidCents: number;
  needsPickup: boolean;
  pickupAddress: string | null;
  pickupRoom: string | null;
  sellerName: string | null;
  checkedInAt: string | null;
};

export async function lookupBookingAction(
  rawCode: string
): Promise<{ ok: true; booking: ScannedBooking } | { ok: false; error: string }> {
  const code = rawCode.trim().toUpperCase();
  if (!code || code.length > 40) return { ok: false, error: 'Código inválido' };
  await requireAdmin();

  const admin = createAdminClient();
  const { data } = await admin
    .from('bookings')
    .select(
      `
      booking_code, status, passenger_count, total_cents, amount_paid_cents,
      needs_pickup, pickup_address, pickup_room, checked_in_at,
      customer:customers ( full_name ),
      schedule:tour_schedules ( departure_at ),
      seller:sellers ( full_name ),
      passengers:booking_passengers ( is_child ),
      payments:payments ( amount_cents, status )
      `
    )
    .eq('booking_code', code)
    .maybeSingle();

  if (!data) return { ok: false, error: 'Reserva não encontrada' };

  type Row = {
    booking_code: string;
    status: string;
    passenger_count: number;
    total_cents: number;
    amount_paid_cents: number;
    needs_pickup: boolean;
    pickup_address: string | null;
    pickup_room: string | null;
    checked_in_at: string | null;
    customer: { full_name: string | null } | { full_name: string | null }[] | null;
    schedule: { departure_at: string } | { departure_at: string }[] | null;
    seller: { full_name: string } | { full_name: string }[] | null;
    passengers: { is_child: boolean }[] | null;
    payments: { amount_cents: number; status: string }[] | null;
  };
  const b = data as unknown as Row;
  const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
  const schedule = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
  const seller = Array.isArray(b.seller) ? b.seller[0] : b.seller;

  // Pago = pagamento online (site/Pagar.me) OU sinal manual (vendedor)
  const onlinePaid = (b.payments ?? [])
    .filter((p) => p.status === 'paid')
    .reduce((acc, p) => Math.max(acc, p.amount_cents), 0);
  const paidCents = Math.max(onlinePaid, b.amount_paid_cents);

  return {
    ok: true,
    booking: {
      bookingCode: b.booking_code,
      status: b.status,
      customerName: customer?.full_name ?? null,
      departureAt: schedule?.departure_at ?? null,
      passengerCount: b.passenger_count,
      childCount: (b.passengers ?? []).filter((p) => p.is_child).length,
      totalCents: b.total_cents,
      paidCents,
      needsPickup: b.needs_pickup,
      pickupAddress: b.pickup_address,
      pickupRoom: b.pickup_room,
      sellerName: seller?.full_name ?? null,
      checkedInAt: b.checked_in_at,
    },
  };
}

export async function checkInBookingAction(
  rawCode: string
): Promise<
  { ok: true; firstCheckin: boolean } | { ok: false; error: string }
> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: 'Código inválido' };

  // RPC roda com o client user-scoped: o guard is_admin(auth.uid()) da
  // função precisa do uid da sessão.
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc('admin_check_in_booking', {
    p_booking_code: code,
  });
  if (error) {
    console.error('[checkInBookingAction]', error);
    const msg = error.message.includes('not found')
      ? 'Reserva não encontrada.'
      : error.message.includes('not paid')
        ? 'Reserva ainda não paga — embarque não permitido.'
        : error.message.includes('cancelled')
          ? 'Reserva cancelada — embarque não permitido.'
          : error.message;
    return { ok: false, error: msg };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, error: 'Falha no check-in.' };

  // Payout de comissão só no PRIMEIRO check-in; nunca bloqueia o embarque
  // (triggerSellerPayout não lança — falha vira retry em /admin/comissoes).
  if (row.first_checkin) {
    const { triggerSellerPayout } = await import('@/lib/seller-payout');
    await triggerSellerPayout(supabase, row.booking_id).catch((e) =>
      console.error('[checkInBookingAction] payout error', e)
    );
  }

  revalidatePath('/admin/reservas');
  revalidatePath('/admin/manifesto');
  revalidatePath('/admin/comissoes');
  return { ok: true, firstCheckin: row.first_checkin };
}
