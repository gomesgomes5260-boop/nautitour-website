'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { cookieNameFor, signBookingCode } from '@/lib/booking-session';

export type CreateBookingInput = {
  scheduleId: string;
  email: string;
  fullName: string;
  phone: string;
  cpf?: string;
  notes?: string;
  passengers: Array<{
    full_name: string;
    document?: string;
    is_child?: boolean;
  }>;
};

export type CreateBookingResult =
  | { ok: true; bookingCode: string }
  | { ok: false; error: string };

export async function createBookingAction(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('create_booking_pending', {
    p_schedule_id: input.scheduleId,
    p_email: input.email.trim(),
    p_full_name: input.fullName.trim(),
    p_phone: input.phone.trim(),
    p_cpf: input.cpf?.trim() || undefined,
    p_notes: input.notes?.trim() || undefined,
    p_passengers: input.passengers.map((p) => ({
      full_name: p.full_name.trim(),
      document: p.document?.trim() || null,
      is_child: !!p.is_child,
    })),
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  const row = data?.[0];
  if (!row?.booking_code) {
    return { ok: false, error: 'Falha ao criar reserva' };
  }

  // Bind this browser session to the booking. The payment actions check
  // this cookie to prevent third parties from generating Pagar.me orders
  // on a booking just by knowing its code.
  const jar = await cookies();
  jar.set(cookieNameFor(row.booking_code), signBookingCode(row.booking_code), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24h — enough for the pending_payment window
  });

  redirect(`/reserva/${row.booking_code}`);
}
