import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Pagination from '@/components/Pagination';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

const PRICE = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const DATE_TIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  confirmed: { label: 'Confirmada', cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  completed: { label: 'Embarcada', cls: 'bg-sky-50 border-sky-200 text-sky-800' },
  cancelled: {
    label: 'Cancelada',
    cls: 'bg-[var(--color-red-50)] border-[var(--color-red-100)] text-[var(--color-red-900)]',
  },
  refunded: { label: 'Reembolsada', cls: 'bg-sky-50 border-sky-200 text-sky-800' },
  pending_payment: {
    label: 'Pendente',
    cls: 'bg-[var(--color-charcoal-50)] border-[var(--color-charcoal-200)] text-[var(--color-charcoal-700)]',
  },
};

export default async function VendedorReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  // Client user-scoped: RLS limita às reservas do vendedor/agência.
  const supabase = await createClient();
  const { data: bookings, count } = await supabase
    .from('bookings')
    .select(
      'id, booking_code, status, passenger_count, total_cents, amount_paid_cents, created_at, schedule:tour_schedules ( departure_at ), tour:tours ( name )',
      { count: 'exact' }
    )
    .not('seller_id', 'is', null)
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  type Row = {
    id: string;
    booking_code: string;
    status: string;
    passenger_count: number;
    total_cents: number;
    amount_paid_cents: number;
    created_at: string;
    schedule: { departure_at: string } | { departure_at: string }[] | null;
    tour: { name: string } | { name: string }[] | null;
  };
  const rows = (bookings ?? []) as unknown as Row[];
  const totalItems = count ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-[var(--color-charcoal-900)]">Minhas reservas</h1>
        <Link
          href="/vendedor/reservas/nova"
          className="rounded-xl bg-[var(--color-red-600)] text-white text-sm font-semibold py-2.5 px-5 hover:bg-[var(--color-red-700)] transition-colors"
        >
          Nova reserva
        </Link>
      </div>

      <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-charcoal-50)] text-left text-[10px] uppercase tracking-[0.12em] text-[var(--color-charcoal-500)]">
              <tr>
                <th className="px-4 py-3 font-bold">Código</th>
                <th className="px-4 py-3 font-bold">Saída</th>
                <th className="px-4 py-3 font-bold">Pax</th>
                <th className="px-4 py-3 font-bold">Total</th>
                <th className="px-4 py-3 font-bold">Sinal</th>
                <th className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-charcoal-500)]">
                    Nenhuma reserva ainda.
                  </td>
                </tr>
              )}
              {rows.map((b) => {
                const schedule = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
                const status = STATUS_LABEL[b.status] ?? {
                  label: b.status,
                  cls: 'bg-[var(--color-charcoal-50)] border-[var(--color-charcoal-200)] text-[var(--color-charcoal-700)]',
                };
                return (
                  <tr key={b.id} className="border-t border-[var(--color-charcoal-100)]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/vendedor/reservas/${b.booking_code}`}
                        className="font-mono font-semibold text-[var(--color-red-600)] hover:underline"
                      >
                        {b.booking_code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-charcoal-700)]">
                      {schedule?.departure_at
                        ? DATE_TIME.format(new Date(schedule.departure_at))
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-charcoal-700)]">{b.passenger_count}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--color-charcoal-900)]">
                      {PRICE.format(b.total_cents / 100)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-charcoal-700)]">
                      {PRICE.format(b.amount_paid_cents / 100)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        buildHref={(p) => `/vendedor/reservas?page=${p}`}
        itemLabel={{ singular: 'reserva', plural: 'reservas' }}
      />
    </div>
  );
}
