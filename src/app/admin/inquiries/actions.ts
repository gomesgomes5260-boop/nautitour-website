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

  // Status anterior pro histórico (monitoramento de tempo de resposta).
  const admin = createAdminClient();
  const { data: before } = await admin
    .from('inquiry_requests')
    .select('status')
    .eq('id', inquiryId)
    .maybeSingle();

  const { error } = await supabase.rpc('admin_update_inquiry', {
    p_inquiry_id: inquiryId,
    p_status: status,
  });
  if (error) {
    console.error('[updateInquiryStatusAction]', error);
    return { ok: false, error: error.message };
  }

  // Log do histórico — best-effort, nunca desfaz a mudança.
  if (before && before.status !== status) {
    await admin
      .from('inquiry_events')
      .insert({
        inquiry_id: inquiryId,
        from_status: before.status,
        to_status: status,
        actor_email: user.email ?? null,
      })
      .then(({ error: e }) => {
        if (e) console.error('[updateInquiryStatusAction] event log', e);
      });
  }

  revalidatePath('/admin/inquiries');
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  return { ok: true };
}

export type CreateManualInquiryInput = {
  tourKind: 'lancha' | 'escuna';
  fullName: string;
  phone: string;
  email?: string | null;
  requestedDate?: string | null; // YYYY-MM-DD
  startTime?: string | null; // HH:MM
  endTime?: string | null; // HH:MM
  passengerCount?: number | null;
  message?: string | null;
};

/**
 * Cotação registrada MANUALMENTE por um operador (chegou por fora do site —
 * WhatsApp direto, balcão, indicação). created_via='manual' identifica a
 * origem nas listas.
 */
export async function createManualInquiryAction(
  input: CreateManualInquiryInput
): Promise<{ ok: true; inquiryId: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/inquiries');
  const ok = await isAdminUser(user.id);
  if (!ok) return { ok: false, error: 'Sem permissão' };

  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  if (fullName.length < 3) return { ok: false, error: 'Informe o nome do cliente.' };
  if (phone.replace(/\D/g, '').length < 8) {
    return { ok: false, error: 'Informe um telefone válido.' };
  }
  if (input.message && input.message.length > 2000) {
    return { ok: false, error: 'Mensagem longa demais (máx 2000).' };
  }
  const pax =
    input.passengerCount != null && Number.isFinite(input.passengerCount)
      ? Math.max(1, Math.min(200, Math.round(input.passengerCount)))
      : null;

  const admin = createAdminClient();

  // Tour do inquérito: lancha = tour private ativo; escuna = primeiro
  // tour scheduled não-teste (a locação usa o mesmo tour da escuna).
  const { data: tours } = await admin
    .from('tours')
    .select('id, tour_type, is_test_only, active')
    .eq('active', true);
  const tour = (tours ?? []).find((t) =>
    input.tourKind === 'lancha'
      ? t.tour_type === 'private'
      : t.tour_type === 'scheduled' && !t.is_test_only
  );
  if (!tour) return { ok: false, error: 'Nenhum tour ativo pra esse tipo.' };

  // Cliente: reusa por e-mail quando informado; sem e-mail usa placeholder
  // .invalid (mesmo padrão da venda de vendedor — fluxos de e-mail pulam).
  const email = input.email?.trim().toLowerCase() || null;
  let customerId: string | null = null;
  if (email) {
    const { data: c, error: cErr } = await admin
      .from('customers')
      .upsert(
        { email, full_name: fullName, phone, is_guest: true },
        { onConflict: 'email' }
      )
      .select('id')
      .single();
    if (cErr) return { ok: false, error: `Falha no cliente: ${cErr.message}` };
    customerId = c.id;
  } else {
    const placeholder = `sem-email+${crypto.randomUUID().replace(/-/g, '')}@no-email.invalid`;
    const { data: c, error: cErr } = await admin
      .from('customers')
      .insert({ email: placeholder, full_name: fullName, phone, is_guest: true })
      .select('id')
      .single();
    if (cErr) return { ok: false, error: `Falha no cliente: ${cErr.message}` };
    customerId = c.id;
  }

  const { data: inquiry, error: iErr } = await admin
    .from('inquiry_requests')
    .insert({
      customer_id: customerId,
      tour_id: tour.id,
      status: 'new',
      created_via: 'manual',
      requested_date: input.requestedDate || null,
      start_time: input.startTime || null,
      end_time: input.endTime || null,
      passenger_count: pax,
      message: input.message?.trim() || null,
    })
    .select('id')
    .single();
  if (iErr) return { ok: false, error: iErr.message };

  await admin
    .from('inquiry_events')
    .insert({
      inquiry_id: inquiry.id,
      from_status: null,
      to_status: 'new',
      actor_email: user.email ?? null,
    })
    .then(({ error: e }) => {
      if (e) console.error('[createManualInquiryAction] event log', e);
    });

  revalidatePath('/admin/inquiries');
  return { ok: true, inquiryId: inquiry.id };
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
