'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin';
import type { Database } from '@/lib/supabase/database.types';

type InquiryStatus = Database['public']['Enums']['inquiry_status'];
const VALID: InquiryStatus[] = ['new', 'contacted', 'won', 'lost'];

async function requireAdminUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/inquiries');
  const ok = await isAdminUser(user.id);
  if (!ok) throw new Error('Sem permissão');
  return user.id;
}

export async function updateInquiryStatusAction(
  inquiryId: string,
  status: InquiryStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!VALID.includes(status)) {
    return { ok: false, error: 'status inválido' };
  }
  // requireAdmin via authenticated client pra propagar auth.uid() na RPC.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/inquiries');
  const ok = await isAdminUser(user.id);
  if (!ok) return { ok: false, error: 'Sem permissão' };

  const { error } = await supabase.rpc('admin_update_inquiry', {
    p_inquiry_id: inquiryId,
    p_status: status,
  });
  if (error) {
    console.error('[updateInquiryStatusAction]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/inquiries');
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  return { ok: true };
}

export async function updateInquiryNotesAction(
  inquiryId: string,
  notes: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (notes.length > 2000) {
    return { ok: false, error: 'Notas longas demais (máx 2000 chars)' };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/inquiries');
  const ok = await isAdminUser(user.id);
  if (!ok) return { ok: false, error: 'Sem permissão' };

  const { error } = await supabase.rpc('admin_update_inquiry', {
    p_inquiry_id: inquiryId,
    p_admin_notes: notes,
  });
  if (error) {
    console.error('[updateInquiryNotesAction]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  return { ok: true };
}

export async function convertInquiryToBookingAction(input: {
  inquiryId: string;
  priceBRL: string; // ex: "1200.00"
  departureAtISO: string; // datetime-local interpretado como BRT
}): Promise<
  { ok: true; bookingCode: string; paymentLinkToken: string }
  | { ok: false; error: string }
> {
  const cents = Math.round(parseFloat(input.priceBRL.replace(',', '.')) * 100);
  if (!Number.isFinite(cents) || cents < 100) {
    return { ok: false, error: 'Preço inválido (mínimo R$ 1,00)' };
  }
  if (!input.departureAtISO) {
    return { ok: false, error: 'Informe data/horário de saída' };
  }
  // datetime-local não tem timezone — interpretar como BRT.
  const ts = `${input.departureAtISO}:00-03:00`;
  const date = new Date(ts);
  if (isNaN(date.getTime()) || date <= new Date()) {
    return { ok: false, error: 'Data/horário deve ser no futuro' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/inquiries');
  const ok = await isAdminUser(user.id);
  if (!ok) return { ok: false, error: 'Sem permissão' };

  const { data, error } = await supabase.rpc('admin_convert_inquiry_to_booking', {
    p_inquiry_id: input.inquiryId,
    p_price_cents: cents,
    p_departure_at: date.toISOString(),
  });
  if (error) {
    console.error('[convertInquiryToBookingAction]', error);
    return { ok: false, error: error.message };
  }
  const row = data?.[0];
  if (!row?.booking_code || !row?.payment_link_token) {
    return { ok: false, error: 'Falha inesperada — conversão não retornou booking' };
  }
  revalidatePath('/admin/inquiries');
  revalidatePath(`/admin/inquiries/${input.inquiryId}`);
  revalidatePath('/admin/reservas');
  return {
    ok: true,
    bookingCode: row.booking_code,
    paymentLinkToken: row.payment_link_token,
  };
}

// Server-side helper pra contar inquiries por status — chip filters.
export async function getInquiryCounts(): Promise<Record<InquiryStatus, number>> {
  await requireAdminUserId();
  const admin = createAdminClient();
  const counts: Record<InquiryStatus, number> = {
    new: 0,
    contacted: 0,
    won: 0,
    lost: 0,
  };
  const { data, error } = await admin
    .from('inquiry_requests')
    .select('status');
  if (error) {
    console.error('[getInquiryCounts]', error);
    return counts;
  }
  for (const row of data ?? []) {
    const s = row.status as InquiryStatus;
    if (s in counts) counts[s] = (counts[s] ?? 0) + 1;
  }
  return counts;
}
