'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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

  redirect(`/reserva/${row.booking_code}`);
}
