'use server';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { cookieNameFor, signBookingCode } from '@/lib/booking-session';
import { verifyTurnstile } from '@/lib/turnstile';
import { bookingLimiter, getClientIp } from '@/lib/rate-limit';
import { isValidCpf, normalizeCpf } from '@/lib/cpf';

export type CreateBookingInput = {
  scheduleId: string;
  email: string;
  fullName: string;
  phone: string;
  cpf: string;
  notes?: string;
  passengers: Array<{
    full_name: string;
    document?: string;
    is_child?: boolean;
  }>;
  turnstileToken: string | null;
};

export type CreateBookingResult =
  | { ok: true; bookingCode: string }
  | { ok: false; error: string };

export async function createBookingAction(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const headersList = await headers();
  const ip = getClientIp(headersList);

  // Captcha (Turnstile) — no-op em dev sem env
  const captcha = await verifyTurnstile(input.turnstileToken, ip);
  if (!captcha.ok) {
    return { ok: false, error: captcha.error };
  }

  // Rate limit IP — no-op em dev sem env
  const limit = await bookingLimiter.limit(ip);
  if (!limit.success) {
    return {
      ok: false,
      error: 'Muitas tentativas de reserva. Tente novamente em alguns minutos.',
    };
  }

  // CPF obrigatório: a adquirente (Stone/Pagar.me) recusa qualquer cobrança
  // sem o documento do cliente ("The customer Document is required").
  if (!isValidCpf(input.cpf)) {
    return { ok: false, error: 'CPF inválido. Confira os números digitados.' };
  }

  // Lancha (private) não fecha reserva pelo site — defesa em profundidade
  // além do 404 da página de checkout (decisão 05/ago).
  {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const { data: sched } = await createAdminClient()
      .from('tour_schedules')
      .select('tour:tours(tour_type)')
      .eq('id', input.scheduleId)
      .maybeSingle();
    const tour = Array.isArray(sched?.tour) ? sched?.tour[0] : sched?.tour;
    if ((tour as { tour_type?: string } | null | undefined)?.tour_type === 'private') {
      return {
        ok: false,
        error: 'Reserva da lancha privativa é feita pelo WhatsApp com a nossa equipe.',
      };
    }
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc('create_booking_pending', {
    p_schedule_id: input.scheduleId,
    p_email: input.email.trim(),
    p_full_name: input.fullName.trim(),
    p_phone: input.phone.trim(),
    p_cpf: normalizeCpf(input.cpf),
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
