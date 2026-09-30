'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin';
import { sendEmail } from '@/lib/email';
import { renderScheduleChanged } from '@/lib/email-templates/schedule-changed';
import { renderPierChanged } from '@/lib/email-templates/pier-changed';

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

export type SetPierResult =
  | { ok: true; notified: number; skipped: number }
  | { ok: false; error: string };

export async function setPierAction(
  scheduleId: string,
  pierSlug: string
): Promise<SetPierResult> {
  const { supabase } = await requireAdmin();

  // Píer atual ANTES da mudança — se for o mesmo, o RPC é noop e ninguém
  // deve receber e-mail.
  const admin = createAdminClient();
  const { data: before } = await admin
    .from('tour_schedules')
    .select('departure_at, pier:embarkation_piers ( slug ), tour:tours ( name )')
    .eq('id', scheduleId)
    .maybeSingle();
  type SlugJ = { slug: string } | { slug: string }[] | null;
  type NameJ = { name: string } | { name: string }[] | null;
  const beforePierJ = (before as { pier?: SlugJ } | null)?.pier;
  const oldSlug = (Array.isArray(beforePierJ) ? beforePierJ[0] : beforePierJ)?.slug ?? null;
  const tourJ = (before as { tour?: NameJ } | null)?.tour;
  const tourName = (Array.isArray(tourJ) ? tourJ[0] : tourJ)?.name ?? 'Passeio Nautitour';

  const { error } = await supabase.rpc('admin_set_embarkation_pier', {
    p_schedule_id: scheduleId,
    p_pier_slug: pierSlug,
  });
  if (error) {
    console.error('[setPierAction] rpc error', error);
    return { ok: false, error: error.message };
  }

  // Aviso automático de local de embarque pros clientes já reservados
  // (pedido do dono, 30/set — clientes precisam saber onde fazer o check-in
  // quando a escala de navios muda o píer). Falha de e-mail nunca desfaz a
  // mudança do píer; só conta como skipped.
  let notified = 0;
  let skipped = 0;
  if (oldSlug !== pierSlug) {
    const { data: newPier } = await admin
      .from('embarkation_piers')
      .select('slug, name, address, google_maps_url, fee_cents')
      .eq('slug', pierSlug)
      .maybeSingle();
    const { data: bookings } = await admin
      .from('bookings')
      .select('booking_code, passenger_count, customer:customers ( email, full_name )')
      .eq('tour_schedule_id', scheduleId)
      .in('status', ['pending_payment', 'confirmed']);

    if (newPier && bookings && bookings.length > 0) {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || 'https://nautitour-website.vercel.app';
      type CustJoined =
        | { email: string; full_name: string | null }
        | { email: string; full_name: string | null }[]
        | null;
      for (const b of bookings) {
        const cJ = (b as { customer?: CustJoined }).customer;
        const customer = Array.isArray(cJ) ? cJ[0] : cJ;
        // Reserva de vendedor pode ter placeholder .invalid — inentregável.
        if (!customer?.email || customer.email.endsWith('.invalid')) {
          skipped++;
          continue;
        }
        const { subject, html, text } = renderPierChanged({
          bookingCode: b.booking_code,
          customerName: customer.full_name ?? '',
          tourName,
          departureAt: before?.departure_at ?? null,
          passengerCount: b.passenger_count,
          siteUrl,
          pier: {
            slug: newPier.slug,
            name: newPier.name,
            address: newPier.address,
            mapsUrl: newPier.google_maps_url,
            feeCents: newPier.fee_cents,
          },
        });
        const r = await sendEmail({ to: customer.email, subject, html, text });
        if (r.ok) notified++;
        else {
          console.error('[setPierAction] email fail', b.booking_code, r);
          skipped++;
        }
      }
    }
  }

  revalidatePath(`/admin/manifesto/${scheduleId}`);
  revalidatePath('/admin/manifesto');
  return { ok: true, notified, skipped };
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
      // Reserva de vendedor pode ter placeholder .invalid — inentregável.
      if (!a.customer_email || a.customer_email.endsWith('.invalid')) {
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
