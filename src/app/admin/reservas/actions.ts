'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin';
import { tourIdsForKind } from '@/lib/tour-filter';

type Filters = { from: string; to: string; status: string; tour?: string };

function csvField(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function exportBookingsCsvAction(
  filters: Filters
): Promise<{ ok: true; csv: string; filename: string } | { ok: false; error: string }> {
  // Re-check auth on every server action call: the layout gate doesn't
  // protect server actions invoked directly.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/reservas');
  const admin = await isAdminUser(user.id);
  if (!admin) return { ok: false, error: 'Sem permissão' };

  const c = createAdminClient();
  let q = c
    .from('bookings')
    .select(
      `
      booking_code,
      status,
      passenger_count,
      total_cents,
      currency,
      created_at,
      tour:tours ( name ),
      schedule:tour_schedules ( departure_at ),
      customer:customers ( email, full_name, phone, cpf )
    `
    )
    .gte('created_at', `${filters.from}T00:00:00Z`)
    .lte('created_at', `${filters.to}T23:59:59Z`)
    .order('created_at', { ascending: false })
    .limit(5000);

  if (filters.status) {
    q = q.eq('status', filters.status as 'pending_payment');
  }
  const tourIds = await tourIdsForKind(c, filters.tour);
  if (tourIds) {
    q = q.in('tour_id', tourIds);
  }

  const { data, error } = await q;
  if (error) {
    console.error('[exportBookingsCsvAction]', error);
    return { ok: false, error: error.message };
  }

  type Joined = {
    booking_code: string;
    status: string;
    passenger_count: number;
    total_cents: number;
    currency: string;
    created_at: string;
    tour: { name: string } | { name: string }[] | null;
    schedule: { departure_at: string } | { departure_at: string }[] | null;
    customer:
      | { email: string; full_name: string | null; phone: string | null; cpf: string | null }
      | { email: string; full_name: string | null; phone: string | null; cpf: string | null }[]
      | null;
  };

  const rows = (data ?? []) as unknown as Joined[];

  const header = [
    'booking_code',
    'created_at',
    'status',
    'tour',
    'departure_at',
    'customer_name',
    'customer_email',
    'customer_phone',
    'customer_cpf',
    'passengers',
    'total_cents',
    'currency',
  ].join(',');

  const lines = rows.map((b) => {
    const tour = Array.isArray(b.tour) ? b.tour[0] : b.tour;
    const sched = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
    const cust = Array.isArray(b.customer) ? b.customer[0] : b.customer;
    return [
      b.booking_code,
      b.created_at,
      b.status,
      tour?.name ?? '',
      sched?.departure_at ?? '',
      cust?.full_name ?? '',
      cust?.email ?? '',
      cust?.phone ?? '',
      cust?.cpf ?? '',
      b.passenger_count,
      b.total_cents,
      b.currency,
    ]
      .map(csvField)
      .join(',');
  });

  // UTF-8 BOM so Excel detects encoding.
  const csv = '﻿' + [header, ...lines].join('\r\n');
  const stamp = new Date().toISOString().slice(0, 10);
  return {
    ok: true,
    csv,
    filename: `reservas-${filters.from}-a-${filters.to}-${stamp}.csv`,
  };
}
