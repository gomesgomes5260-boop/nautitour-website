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
  { ok: true; cancelledBookings: number } | { ok: false; error: string }
> {
  if (!scheduleId) return { ok: false, error: 'schedule inválido' };
  if (!reason || reason.trim().length < 3) {
    return { ok: false, error: 'Informe um motivo (pelo menos 3 caracteres).' };
  }
  await requireAdmin();
  const c = createAdminClient();
  const { data, error } = await c.rpc('block_schedule', {
    p_schedule_id: scheduleId,
    p_reason: reason.trim(),
  });
  if (error) {
    console.error('[blockScheduleAction]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/manifesto');
  revalidatePath(`/admin/manifesto/${scheduleId}`);
  return { ok: true, cancelledBookings: data ?? 0 };
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
