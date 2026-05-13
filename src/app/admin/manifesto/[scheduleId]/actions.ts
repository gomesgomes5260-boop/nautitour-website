'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin';
import { sendEmail } from '@/lib/email';
import { renderScheduleChanged } from '@/lib/email-templates/schedule-changed';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/manifesto');
  if (!(await isAdminUser(user.id))) {
    throw new Error('Sem permissão');
  }
  return { supabase, user };
}

export type SetPierResult = { ok: true } | { ok: false; error: string };

export async function setPierAction(
  scheduleId: string,
  pierSlug: string
): Promise<SetPierResult> {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.rpc('admin_set_embarkation_pier', {
    p_schedule_id: scheduleId,
    p_pier_slug: pierSlug,
  });
  if (error) {
    console.error('[setPierAction] rpc error', error);
    return { ok: false, error: error.message };
  }

  revalidatePath(`/admin/manifesto/${scheduleId}`);
  revalidatePath('/admin/manifesto');
  return { ok: true };
}

// ============================================================
// Editar saída (datetime / capacity / price / status)
// ============================================================
export type EditScheduleInput = {
  scheduleId: string;
  departureAt?: string | null;  // ISO; null = não muda
  capacity?: number | null;
  priceCents?: number | null;   // -1 = remove override (volta pro base do tour)
  status?: 'open' | 'sold_out' | 'cancelled' | null;
  notifyCustomers: boolean;
};

export type EditScheduleResult =
  | { ok: true; notified: number; skipped: number }
  | { ok: false; error: string };

export async function editScheduleAction(
  input: EditScheduleInput
): Promise<EditScheduleResult> {
  const { supabase } = await requireAdmin();

  const { data: affected, error } = await supabase.rpc(
    'admin_update_tour_schedule',
    {
      p_schedule_id: input.scheduleId,
      p_departure_at: input.departureAt ?? undefined,
      p_capacity: input.capacity ?? undefined,
      p_price_cents: input.priceCents ?? undefined,
      p_status: input.status ?? undefined,
    }
  );
  if (error) {
    console.error('[editScheduleAction] rpc error', error);
    return { ok: false, error: error.message };
  }

  let notified = 0;
  let skipped = 0;

  // Notificação: só faz sentido se a data/hora mudou + admin pediu pra notificar
  if (
    input.notifyCustomers &&
    input.departureAt &&
    Array.isArray(affected) &&
    affected.length > 0
  ) {
    // Pega tour name pra subject
    const admin = createAdminClient();
    const { data: schedule } = await admin
      .from('tour_schedules')
      .select('tour:tours(name)')
      .eq('id', input.scheduleId)
      .maybeSingle();
    type T = { name: string } | { name: string }[] | null | undefined;
    const tourJoined = (schedule as { tour?: T } | null)?.tour;
    const tourName = (Array.isArray(tourJoined) ? tourJoined[0] : tourJoined)?.name ?? 'Passeio Nautitour';

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://nautitour-website.vercel.app';

    // Carrega nomes dos customers em batch
    const { data: bookings } = await admin
      .from('bookings')
      .select('booking_code, customer:customers(full_name)')
      .in('booking_code', affected.map((a) => a.affected_booking_code));
    type CustJ = { full_name: string | null } | { full_name: string | null }[] | null;
    const nameByCode = new Map<string, string>();
    for (const b of bookings ?? []) {
      const c = (b as { customer?: CustJ }).customer;
      const cu = Array.isArray(c) ? c[0] : c;
      nameByCode.set(b.booking_code, cu?.full_name ?? '');
    }

    for (const a of affected) {
      if (!a.customer_email) {
        skipped++;
        continue;
      }
      const { subject, html, text } = renderScheduleChanged({
        bookingCode: a.affected_booking_code,
        customerName: nameByCode.get(a.affected_booking_code) ?? '',
        tourName,
        oldDepartureAt: a.old_departure_at,
        newDepartureAt: a.new_departure_at,
        siteUrl,
      });
      const r = await sendEmail({
        to: a.customer_email,
        subject,
        html,
        text,
      });
      if (r.ok) notified++;
      else {
        console.error('[editScheduleAction] email fail', a.customer_email, r);
        skipped++;
      }
    }
  }

  revalidatePath(`/admin/manifesto/${input.scheduleId}`);
  revalidatePath('/admin/manifesto');
  return { ok: true, notified, skipped };
}

// ============================================================
// Deletar saída
// ============================================================
export type DeleteScheduleResult =
  | { ok: true; cancelledBookings: number }
  | { ok: false; error: string };

export async function deleteScheduleAction(
  scheduleId: string,
  force: boolean
): Promise<DeleteScheduleResult> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase.rpc('admin_delete_tour_schedule', {
    p_schedule_id: scheduleId,
    p_force: force,
  });
  if (error) {
    console.error('[deleteScheduleAction] rpc error', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/manifesto');
  return { ok: true, cancelledBookings: data ?? 0 };
}
