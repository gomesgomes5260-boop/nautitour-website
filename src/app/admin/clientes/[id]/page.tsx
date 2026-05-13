import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Wallet, Clock } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import KpiCard from '@/components/KpiCard';

export const dynamic = 'force-dynamic';

const PRICE = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const DATETIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const STATUS_LABEL: Record<string, { label: string; cls: string; dot: string }> = {
  pending_payment: {
    label: 'Pendente',
    cls: 'bg-amber-50 text-amber-800',
    dot: 'bg-amber-500',
  },
  confirmed: {
    label: 'Confirmada',
    cls: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  completed: {
    label: 'Concluída',
    cls: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelada',
    cls: 'bg-[var(--color-red-50)] text-[var(--color-red-900)]',
    dot: 'bg-[var(--color-red-600)]',
  },
  refunded: {
    label: 'Reembolsada',
    cls: 'bg-sky-50 text-sky-700',
    dot: 'bg-sky-500',
  },
};

const VIP_THRESHOLD_CENTS = 300000;

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: customer } = await admin
    .from('customers')
    .select('id, full_name, email, phone, cpf, is_guest, auth_user_id, created_at')
    .eq('id', id)
    .maybeSingle();

  if (!customer) notFound();

  // Bookings (todos os status, ordenados por created_at desc)
  const { data: bookings } = await admin
    .from('bookings')
    .select(
      `
      id,
      booking_code,
      status,
      passenger_count,
      total_cents,
      created_at,
      tour:tours ( name, slug, tour_type, is_test_only ),
      schedule:tour_schedules ( departure_at )
      `
    )
    .eq('customer_id', id)
    .order('created_at', { ascending: false });

  type BookingRow = {
    id: string;
    booking_code: string;
    status: string;
    passenger_count: number;
    total_cents: number;
    created_at: string;
    tour:
      | { name: string; slug: string; tour_type: string; is_test_only: boolean }
      | { name: string; slug: string; tour_type: string; is_test_only: boolean }[]
      | null;
    schedule: { departure_at: string } | { departure_at: string }[] | null;
  };
  const rows = (bookings ?? []) as unknown as BookingRow[];

  // Stats excluindo tour-de-teste e bookings sem pagamento
  const activeRows = rows.filter((b) => {
    const t = Array.isArray(b.tour) ? b.tour[0] : b.tour;
    return t && !t.is_test_only && ['confirmed', 'completed', 'refunded'].includes(b.status);
  });
  const totalSpent = activeRows.reduce((acc, b) => acc + b.total_cents, 0);
  const totalBookings = activeRows.length;
  const lastBooking = rows[0]?.created_at;

  const hasLancha = activeRows.some((b) => {
    const t = Array.isArray(b.tour) ? b.tour[0] : b.tour;
    return t?.tour_type === 'private';
  });

  const tags: Array<{ label: string; cls: string }> = [];
  if (totalSpent >= VIP_THRESHOLD_CENTS) {
    tags.push({ label: 'VIP', cls: 'bg-amber-50 text-amber-800' });
  }
  if (totalBookings > 1) {
    tags.push({ label: 'Recorrente', cls: 'bg-emerald-50 text-emerald-700' });
  }
  if (hasLancha) {
    tags.push({ label: 'Lancha', cls: 'bg-sky-50 text-sky-700' });
  }
  if (customer.is_guest) {
    tags.push({
      label: 'Guest',
      cls: 'bg-[var(--color-charcoal-100)] text-[var(--color-charcoal-700)]',
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link
          href="/admin/clientes"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-charcoal-500)] hover:text-[var(--color-charcoal-900)] transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar para clientes
        </Link>
      </div>

      <div className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6 mb-6">
        <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
          <h1
            className="font-display font-semibold text-[var(--color-charcoal-900)] tracking-tight"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
          >
            {customer.full_name || customer.email}
          </h1>
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <span
                key={t.label}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${t.cls}`}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
          <Field label="E-mail">
            <a
              href={`mailto:${customer.email}`}
              className="text-[var(--color-charcoal-700)] underline-offset-2 hover:underline"
            >
              {customer.email}
            </a>
          </Field>
          <Field label="Telefone">{customer.phone ?? '—'}</Field>
          <Field label="CPF">{customer.cpf ?? '—'}</Field>
          <Field label="Cadastro">
            {customer.is_guest
              ? 'Guest (sem login)'
              : DATETIME.format(new Date(customer.created_at))}
          </Field>
        </dl>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <KpiCard
          Icon={Calendar}
          iconTone="bg-sky-50 text-sky-700"
          label="Reservas ativas"
          value={String(totalBookings)}
        />
        <KpiCard
          Icon={Wallet}
          iconTone="bg-[var(--color-red-50)] text-[var(--color-red-600)]"
          label="Gasto total"
          value={PRICE.format(totalSpent / 100)}
        />
        <KpiCard
          Icon={Clock}
          iconTone="bg-emerald-50 text-emerald-700"
          label="Última reserva"
          value={lastBooking ? DATETIME.format(new Date(lastBooking)) : '—'}
        />
      </div>

      <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-charcoal-100)]">
          <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)]">
            Histórico ({rows.length} reserva{rows.length === 1 ? '' : 's'})
          </h2>
        </div>
        {rows.length === 0 ? (
          <p className="px-6 py-10 text-sm text-[var(--color-charcoal-500)] text-center">
            Cliente sem reservas.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-charcoal-50)] text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-charcoal-500)]">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Tour</th>
                <th className="px-4 py-3 hidden md:table-cell">Saída</th>
                <th className="px-4 py-3 text-center">Pax</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => {
                const tour = Array.isArray(b.tour) ? b.tour[0] : b.tour;
                const sched = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
                const st = STATUS_LABEL[b.status] ?? {
                  label: b.status,
                  cls: 'bg-[var(--color-charcoal-100)] text-[var(--color-charcoal-700)]',
                  dot: 'bg-[var(--color-charcoal-400)]',
                };
                return (
                  <tr
                    key={b.id}
                    className="border-t border-[var(--color-charcoal-100)] hover:bg-[var(--color-charcoal-50)]/60"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link
                        href={`/admin/reservas/${b.booking_code}`}
                        className="text-[var(--color-charcoal-700)] underline-offset-2 hover:underline"
                      >
                        {b.booking_code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-charcoal-900)]">
                      {tour?.name ?? '—'}
                      {tour?.is_test_only && (
                        <span className="ml-2 text-[10px] text-[var(--color-charcoal-500)]">
                          (teste)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-[var(--color-charcoal-500)]">
                      {sched?.departure_at
                        ? DATETIME.format(new Date(sched.departure_at))
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-[var(--color-charcoal-900)] tabular-nums">
                      {b.passenger_count}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${st.cls}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${st.dot}`}
                          aria-hidden
                        />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--color-charcoal-900)]">
                      {PRICE.format(b.total_cents / 100)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--color-charcoal-500)] mb-1">
        {label}
      </dt>
      <dd className="text-[var(--color-charcoal-900)]">{children}</dd>
    </div>
  );
}
