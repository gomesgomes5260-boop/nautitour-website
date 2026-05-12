'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function cancelOwnBookingAction(
  bookingCode: string,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!bookingCode) return { ok: false, error: 'Reserva inválida' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/reserva/${encodeURIComponent(bookingCode)}`);
  }

  // Buscar booking_id (RPC opera por id, UI opera por code)
  const admin = createAdminClient();
  const { data: booking, error: fetchErr } = await admin
    .from('bookings')
    .select('id')
    .eq('booking_code', bookingCode)
    .maybeSingle();
  if (fetchErr) {
    console.error('[cancelOwnBookingAction] fetch', fetchErr);
    return { ok: false, error: 'Falha ao carregar reserva' };
  }
  if (!booking) return { ok: false, error: 'Reserva não encontrada' };

  // RPC roda como usuário autenticado pra `auth.uid()` funcionar e a
  // própria função fazer a checagem de ownership e janela de 48h.
  const { error } = await supabase.rpc('customer_cancel_booking', {
    p_booking_id: booking.id,
    p_reason: reason.trim(),
  });
  if (error) {
    console.error('[cancelOwnBookingAction] rpc', error);
    // Mensagens da RPC já são adequadas pra mostrar (forbidden, window
    // closed, etc.). Não vazamos detalhes de constraint.
    return { ok: false, error: error.message };
  }

  revalidatePath('/minhas-reservas');
  revalidatePath(`/reserva/${bookingCode}`);
  return { ok: true };
}
