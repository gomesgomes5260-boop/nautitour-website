'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser, isOwnerUser } from '@/lib/admin';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/config');
  const admin = await isAdminUser(user.id);
  if (!admin) {
    throw new Error('Sem permissão');
  }
  return user;
}

async function requireOwnerAuthenticated() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/config');
  const owner = await isOwnerUser(user.id);
  if (!owner) throw new Error('Apenas owners podem fazer isso');
  return { supabase, user };
}

export async function regenerateSchedulesAction(): Promise<
  { ok: true; created: number } | { ok: false; error: string }
> {
  await requireAdmin();
  const c = createAdminClient();
  const { data, error } = await c.rpc('generate_future_schedules', {
    p_days_ahead: 28,
  });
  if (error) {
    console.error('[regenerateSchedulesAction]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/config');
  revalidatePath('/admin/manifesto');
  return { ok: true, created: data ?? 0 };
}

export async function blockScheduleAction(
  scheduleId: string,
  reason: string
): Promise<
  { ok: true; cancelledBookings: number; emailsSent: number } | { ok: false; error: string }
> {
  if (!scheduleId) return { ok: false, error: 'schedule inválido' };
  if (!reason || reason.trim().length < 3) {
    return { ok: false, error: 'Informe um motivo (pelo menos 3 caracteres).' };
  }
  await requireAdmin();
  const c = createAdminClient();

  // Snapshot das reservas ativas ANTES do bloqueio — depois da RPC elas já
  // estão cancelled e não dá mais pra saber quem foi afetado.
  const affected = await loadActiveBookingsForSchedule(c, scheduleId);

  const { data, error } = await c.rpc('block_schedule', {
    p_schedule_id: scheduleId,
    p_reason: reason.trim(),
  });
  if (error) {
    console.error('[blockScheduleAction]', error);
    return { ok: false, error: error.message };
  }

  // Aviso de cancelamento (clima/Marinha) com CTA de reagendamento —
  // best-effort: falha de e-mail nunca desfaz o bloqueio.
  const emailsSent = await sendScheduleCancelledEmails(affected, reason.trim()).catch(
    (e) => {
      console.error('[blockScheduleAction] emails', e);
      return 0;
    }
  );

  revalidatePath('/admin/manifesto');
  revalidatePath(`/admin/manifesto/${scheduleId}`);
  return { ok: true, cancelledBookings: data ?? 0, emailsSent };
}

type AffectedBooking = {
  bookingId: string;
  booking_code: string;
  customerEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  tourName: string;
  departureAt: string | null;
  sellerName: string | null;
  sellerPhone: string | null;
};

async function loadActiveBookingsForSchedule(
  c: ReturnType<typeof createAdminClient>,
  scheduleId: string
): Promise<AffectedBooking[]> {
  const { data } = await c
    .from('bookings')
    .select(
      `
      id, booking_code,
      customer:customers ( email, full_name, phone ),
      seller:sellers ( full_name, phone ),
      tour:tours ( name ),
      schedule:tour_schedules ( departure_at )
      `
    )
    .eq('tour_schedule_id', scheduleId)
    .in('status', ['pending_payment', 'confirmed']);

  type CustomerJoined = { email: string; full_name: string | null; phone: string | null };
  type Row = {
    id: string;
    booking_code: string;
    customer: CustomerJoined | CustomerJoined[] | null;
    seller: { full_name: string; phone: string | null } | { full_name: string; phone: string | null }[] | null;
    tour: { name: string } | { name: string }[] | null;
    schedule: { departure_at: string } | { departure_at: string }[] | null;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => {
    const customer = Array.isArray(r.customer) ? r.customer[0] : r.customer;
    const seller = Array.isArray(r.seller) ? r.seller[0] : r.seller;
    const tour = Array.isArray(r.tour) ? r.tour[0] : r.tour;
    const schedule = Array.isArray(r.schedule) ? r.schedule[0] : r.schedule;
    return {
      bookingId: r.id,
      booking_code: r.booking_code,
      customerEmail: customer?.email ?? null,
      customerName: customer?.full_name ?? null,
      customerPhone: customer?.phone ?? null,
      tourName: tour?.name ?? 'Passeio Nautitour',
      departureAt: schedule?.departure_at ?? null,
      sellerName: seller?.full_name ?? null,
      sellerPhone: seller?.phone ?? null,
    };
  });
}

async function sendScheduleCancelledEmails(
  affected: AffectedBooking[],
  reason: string
): Promise<number> {
  if (affected.length === 0) return 0;

  const { renderScheduleCancelled } = await import(
    '@/lib/email-templates/schedule-cancelled'
  );
  const { buildWaUrl } = await import('@/lib/whatsapp');
  const { sendEmail } = await import('@/lib/email');
  const { sendSms, toSmsReceiver } = await import('@/lib/sms');
  const { buildScheduleCancelledSms } = await import('@/lib/sms-messages');
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://nautitour-website.vercel.app';
  const rebookUrl = `${siteUrl.replace(/\/$/, '')}/passeio-escuna`;
  const c = createAdminClient();

  let sent = 0;
  for (const b of affected) {
    // Canal e-mail — placeholder .invalid = venda de vendedor sem e-mail.
    if (b.customerEmail && !b.customerEmail.endsWith('.invalid')) {
      // Reserva de vendedor com telefone → contato direto com o vendedor;
      // senão, WhatsApp canônico da empresa.
      const sellerDigits = (b.sellerPhone ?? '').replace(/\D/g, '');
      const hasSellerWa = b.sellerName && sellerDigits.length >= 10;
      const waMsg = `Olá! Minha reserva ${b.booking_code} foi cancelada (clima/Marinha) e quero reagendar.`;
      const waUrl = hasSellerWa
        ? `https://wa.me/${sellerDigits.length <= 11 ? `55${sellerDigits}` : sellerDigits}?text=${encodeURIComponent(waMsg)}`
        : buildWaUrl(waMsg);

      const { subject, html, text } = renderScheduleCancelled({
        bookingCode: b.booking_code,
        customerName: b.customerName ?? '',
        tourName: b.tourName,
        departureAt: b.departureAt,
        reason,
        siteUrl,
        waUrl,
        contactLabel: hasSellerWa ? `${b.sellerName} (seu vendedor)` : 'nossa equipe',
      });
      const res = await sendEmail({ to: b.customerEmail, subject, html, text });
      if (res.ok) sent++;
    }

    // Canal SMS — best-effort, independente do e-mail (cobre inclusive
    // reservas de vendedor sem e-mail, que têm telefone).
    const receiver = toSmsReceiver(b.customerPhone);
    if (receiver) {
      const content = buildScheduleCancelledSms({
        departureAt: b.departureAt,
        bookingCode: b.booking_code,
        rebookUrl,
      });
      const smsRes = await sendSms({ to: receiver, content });
      if (smsRes.ok) {
        const { error: evErr } = await c.from('booking_events').insert({
          booking_id: b.bookingId,
          kind: 'sms_sent',
          payload: { template: 'schedule_cancelled', request_id: smsRes.id ?? null },
        });
        if (evErr) console.error('[sendScheduleCancelledEmails] event insert', evErr);
      } else if ('error' in smsRes) {
        console.error('[sendScheduleCancelledEmails] sms fail', b.booking_code, smsRes.error);
      }
    }
  }
  return sent;
}

// ============================================================
// Admin management — owner-only
// ============================================================

export async function addAdminAction(
  email: string,
  role: 'owner' | 'operator'
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = email.trim();
  if (!trimmed || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
    return { ok: false, error: 'E-mail inválido' };
  }
  if (role !== 'owner' && role !== 'operator') {
    return { ok: false, error: 'Role inválida' };
  }

  const { supabase } = await requireOwnerAuthenticated();
  const { error } = await supabase.rpc('admin_add_admin_by_email', {
    p_email: trimmed,
    p_role: role,
  });
  if (error) {
    console.error('[addAdminAction]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/config');
  return { ok: true };
}

export async function removeAdminAction(
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!userId) return { ok: false, error: 'userId inválido' };
  const { supabase } = await requireOwnerAuthenticated();
  const { error } = await supabase.rpc('admin_remove_admin', {
    p_user_id: userId,
  });
  if (error) {
    console.error('[removeAdminAction]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/config');
  return { ok: true };
}

// ============================================================
// Pricing — any admin (não só owner)
// ============================================================

// ============================================================
// Schedule templates CRUD
// ============================================================

export async function createScheduleTemplateAction(input: {
  tourId: string;
  weekday: number;
  departureTime: string; // HH:MM
  capacity: number;
  priceCents: number | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!input.tourId) return { ok: false, error: 'tour inválido' };
  if (input.weekday < 0 || input.weekday > 6) return { ok: false, error: 'dia da semana inválido' };
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(input.departureTime)) return { ok: false, error: 'horário inválido (HH:MM)' };
  if (!Number.isInteger(input.capacity) || input.capacity <= 0) return { ok: false, error: 'capacidade inválida' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/config');
  if (!(await isAdminUser(user.id))) return { ok: false, error: 'Sem permissão' };

  const { data, error } = await supabase.rpc('admin_create_schedule_template', {
    p_tour_id: input.tourId,
    p_weekday: input.weekday,
    p_departure_time: input.departureTime.length === 5 ? `${input.departureTime}:00` : input.departureTime,
    p_capacity: input.capacity,
    p_price_cents: input.priceCents ?? undefined,
  });
  if (error) {
    console.error('[createScheduleTemplateAction]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/config');
  return { ok: true, id: data as string };
}

export async function updateScheduleTemplateAction(input: {
  templateId: string;
  weekday?: number;
  departureTime?: string;
  capacity?: number;
  priceCents?: number | null; // -1 = remover override
  active?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.templateId) return { ok: false, error: 'template inválido' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/config');
  if (!(await isAdminUser(user.id))) return { ok: false, error: 'Sem permissão' };

  const { error } = await supabase.rpc('admin_update_schedule_template', {
    p_template_id: input.templateId,
    p_weekday: input.weekday ?? undefined,
    p_departure_time: input.departureTime
      ? input.departureTime.length === 5
        ? `${input.departureTime}:00`
        : input.departureTime
      : undefined,
    p_capacity: input.capacity ?? undefined,
    p_price_cents: input.priceCents ?? undefined,
    p_active: input.active ?? undefined,
  });
  if (error) {
    console.error('[updateScheduleTemplateAction]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/config');
  return { ok: true };
}

export async function deleteScheduleTemplateAction(
  templateId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!templateId) return { ok: false, error: 'template inválido' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/config');
  if (!(await isAdminUser(user.id))) return { ok: false, error: 'Sem permissão' };

  const { error } = await supabase.rpc('admin_delete_schedule_template', {
    p_template_id: templateId,
  });
  if (error) {
    console.error('[deleteScheduleTemplateAction]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/config');
  return { ok: true };
}

// ============================================================
// Create tour_schedule manual
// ============================================================

export async function createTourScheduleAction(input: {
  tourId: string;
  departureAtBRT: string; // 'YYYY-MM-DDTHH:mm' em BRT (do input datetime-local)
  capacity: number;
  priceCents: number | null;
  pierSlug: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!input.tourId) return { ok: false, error: 'tour inválido' };
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(input.departureAtBRT)) {
    return { ok: false, error: 'data/hora inválida' };
  }
  if (!Number.isInteger(input.capacity) || input.capacity <= 0) {
    return { ok: false, error: 'capacidade inválida' };
  }

  // BRT (UTC-3) → UTC ISO
  const [datePart, timePart] = input.departureAtBRT.split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi] = timePart.split(':').map(Number);
  const iso = new Date(Date.UTC(y, mo - 1, d, h + 3, mi, 0)).toISOString();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/manifesto');
  if (!(await isAdminUser(user.id))) return { ok: false, error: 'Sem permissão' };

  const { data, error } = await supabase.rpc('admin_create_tour_schedule', {
    p_tour_id: input.tourId,
    p_departure_at: iso,
    p_capacity: input.capacity,
    p_price_cents: input.priceCents ?? undefined,
    p_pier_slug: input.pierSlug ?? undefined,
    p_status: 'open',
  });
  if (error) {
    console.error('[createTourScheduleAction]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/manifesto');
  revalidatePath('/admin/config');
  return { ok: true, id: data as string };
}

// ============================================================
// Pricing — any admin (não só owner)
// ============================================================

export async function updateTourPricingAction(input: {
  tourId: string;
  basePriceCents?: number | null;
  maxCapacity?: number | null;
  applyToFutureSchedules: boolean;
}): Promise<
  { ok: true; schedulesUpdated: number } | { ok: false; error: string }
> {
  if (!input.tourId) return { ok: false, error: 'tour inválido' };
  if (input.basePriceCents == null && input.maxCapacity == null) {
    return { ok: false, error: 'Informe pelo menos preço ou capacidade.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/config');
  const adminOk = await isAdminUser(user.id);
  if (!adminOk) return { ok: false, error: 'Sem permissão' };

  const { data, error } = await supabase.rpc('admin_update_tour_pricing', {
    p_tour_id: input.tourId,
    p_base_price_cents: input.basePriceCents ?? undefined,
    p_max_capacity: input.maxCapacity ?? undefined,
    p_apply_to_future_schedules: input.applyToFutureSchedules,
  });
  if (error) {
    console.error('[updateTourPricingAction]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/config');
  revalidatePath('/admin/manifesto');
  return { ok: true, schedulesUpdated: data ?? 0 };
}
