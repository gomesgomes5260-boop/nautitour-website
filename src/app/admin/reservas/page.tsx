import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import ExportCsvButton from './ExportCsvButton';

export const dynamic = 'force-dynamic';

const DATETIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const PRICE = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
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

const STATUSES = [
  { value: '', label: 'Todos' },
  { value: 'pending_payment', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'refunded', label: 'Reembolsada' },
] as const;

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type Search = { from?: string; to?: string; status?: string };

const inputClass =
  'border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2 text-sm text-[var(--color-charcoal-900)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors';

export default async function AdminReservasPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const today = new Date();
  const past = new Date(today);
  past.setDate(past.getDate() - 30);

  const from = sp.from || isoDay(past);
  const to = sp.to || isoDay(today);
  const status = sp.status || '';

  const admin = createAdminClient();
  let q = admin
    .from('bookings')
    .select(
      `
      id,
      booking_code,
      status,
      passenger_count,
      total_cents,
      currency,
      created_at,
      tour:tours ( name ),
      schedule:tour_schedules ( departure_at ),
      customer:customers ( email, full_name )
    `
    )
    .gte('created_at', `${from}T00:00:00Z`)
    .lte('created_at', `${to}T23:59:59Z`)
    .order('created_at', { ascending: false })
    .limit(500);

  if (status) {
    q = q.eq('status', status as 'pending_payment');
  }

  const { data, error } = await q;

  type Joined = {
    id: string;
    booking_code: string;
    status: string;
    passenger_count: number;
    total_cents: number;
    currency: string;
    created_at: string;
    tour: { name: string } | { name: string }[] | null;
    schedule: { departure_at: string } | { departure_at: string }[] | null;
    customer:
      | { email: string; full_name: string | null }
      | { email: string; full_name: string | null }[]
      | null;
  };

  const rows = (data ?? []) as unknown as Joined[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1
          className="font-display font-semibold text-[var(--color-charcoal-900)] tracking-tight"
          style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
        >
          Reservas
        </h1>
        <ExportCsvButton filters={{ from, to, status }} />
      </div>

      <form className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-5 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-[var(--color-charcoal-700)] mb-1.5">
            De
          </label>
          <input type="date" name="from" defaultValue={from} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-charcoal-700)] mb-1.5">
            Até
          </label>
          <input type="date" name="to" defaultValue={to} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-charcoal-700)] mb-1.5">
            Status
          </label>
          <select name="status" defaultValue={status} className={inputClass}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
        >
          Filtrar
        </button>
      </form>

      {error && (
        <div className="bg-[var(--color-red-50)] border border-[var(--color-red-100)] text-[var(--color-red-900)] rounded-xl p-3 mb-4 text-sm">
          Erro ao carregar reservas: {error.message}
        </div>
      )}

      <div className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-charcoal-50)] text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-charcoal-500)]">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3 hidden md:table-cell">E-mail</th>
              <th className="px-4 py-3">Tour</th>
              <th className="px-4 py-3 hidden md:table-cell">Saída</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-[var(--color-charcoal-500)]"
                >
                  Nenhuma reserva no período.
                </td>
              </tr>
            )}
            {rows.map((b) => {
              const tour = Array.isArray(b.tour) ? b.tour[0] : b.tour;
              const sched = Array.isArray(b.schedule)
                ? b.schedule[0]
                : b.schedule;
              const cust = Array.isArray(b.customer)
                ? b.customer[0]
                : b.customer;
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
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-charcoal-900)]">
                    {b.booking_code}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-charcoal-900)]">
                    {cust?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-[var(--color-charcoal-500)]">
                    {cust?.email ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-charcoal-700)]">
                    {tour?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-[var(--color-charcoal-500)] text-xs">
                    {sched?.departure_at
                      ? DATETIME.format(new Date(sched.departure_at))
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${st.cls}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} aria-hidden />
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--color-charcoal-900)]">
                    {PRICE.format(b.total_cents / 100)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/reservas/${b.booking_code}`}
                      className="text-[var(--color-charcoal-700)] underline-offset-2 hover:underline text-xs font-medium"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[var(--color-charcoal-500)] mt-3">
        Mostrando até 500 reservas. Use os filtros pra refinar.
      </p>
    </div>
  );
}
