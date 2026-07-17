'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin';
import { sendEmail } from '@/lib/email';
import { renderScheduleChanged } from '@/lib/email-templates/schedule-changed';
import { sendSms, toSmsReceiver } from '@/lib/sms';
import { buildScheduleChangedSms } from '@/lib/sms-messages';

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
  | { ok: true; notified: number; skipped: number; smsSent: number }
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
  let smsSent = 0;

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

    // Carrega nomes/telefones dos customers em batch (+ id pro booking_events)
    const { data: bookings } = await admin
      .from('bookings')
      .select('id, booking_code, customer:customers(full_name, phone)')
      .in('booking_code', affected.map((a) => a.affected_booking_code));
    type CustJ =
      | { full_name: string | null; phone: string | null }
      | { full_name: string | null; phone: string | null }[]
      | null;
    const nameByCode = new Map<string, string>();
    const phoneByCode = new Map<string, string | null>();
    const idByCode = new Map<string, string>();
    for (const b of bookings ?? []) {
      const c = (b as { customer?: CustJ }).customer;
      const cu = Array.isArray(c) ? c[0] : c;
      nameByCode.set(b.booking_code, cu?.full_name ?? '');
      phoneByCode.set(b.booking_code, cu?.phone ?? null);
      idByCode.set(b.booking_code, (b as { id: string }).id);
    }

    for (const a of affected) {
      // Canal e-mail (reserva de vendedor pode ter placeholder .invalid)
      if (!a.customer_email || a.customer_email.endsWith('.invalid')) {
        skipped++;
      } else {
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

      // Canal SMS — best-effort, independente do e-mail
      const receiver = toSmsReceiver(phoneByCode.get(a.affected_booking_code));
      if (receiver) {
        const content = buildScheduleChangedSms({
          newDepartureAt: a.new_departure_at,
          bookingCode: a.affected_booking_code,
          bookingUrl: `${siteUrl.replace(/\/$/, '')}/reserva/${encodeURIComponent(a.affected_booking_code)}`,
        });
        const smsRes = await sendSms({ to: receiver, content });
        if (smsRes.ok) {
          smsSent++;
          const bookingId = idByCode.get(a.affected_booking_code);
          if (bookingId) {
            const { error: evErr } = await admin.from('booking_events').insert({
              booking_id: bookingId,
              kind: 'sms_sent',
              payload: { template: 'schedule_changed', request_id: smsRes.id ?? null },
            });
            if (evErr) console.error('[editScheduleAction] event insert', evErr);
          }
        } else if ('error' in smsRes) {
          console.error('[editScheduleAction] sms fail', a.affected_booking_code, smsRes.error);
        }
      }
    }
  }

  revalidatePath(`/admin/manifesto/${input.scheduleId}`);
  revalidatePath('/admin/manifesto');
  return { ok: true, notified, skipped, smsSent };
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
