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

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending_payment: { label: 'Pendente', cls: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Confirmada', cls: 'bg-green-100 text-green-800' },
  completed: { label: 'Concluída', cls: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelada', cls: 'bg-red-100 text-red-800' },
  refunded: { label: 'Reembolsada', cls: 'bg-blue-100 text-blue-800' },
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Reservas</h1>
        <ExportCsvButton filters={{ from, to, status }} />
      </div>

      <form className="bg-white border border-gray-200 rounded-md p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">De</label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Até</label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Status</label>
          <select
            name="status"
            defaultValue={status}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-[rgb(9,110,171)] text-white text-sm px-4 py-1.5 rounded hover:opacity-90"
        >
          Filtrar
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3 mb-4 text-sm">
          Erro ao carregar reservas: {error.message}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2 hidden md:table-cell">E-mail</th>
              <th className="px-4 py-2">Tour</th>
              <th className="px-4 py-2 hidden md:table-cell">Saída</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Total</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-gray-500"
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
                cls: 'bg-gray-100 text-gray-800',
              };
              return (
                <tr key={b.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-xs">
                    {b.booking_code}
                  </td>
                  <td className="px-4 py-2">
                    {cust?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-2 hidden md:table-cell text-gray-600">
                    {cust?.email ?? '—'}
                  </td>
                  <td className="px-4 py-2">{tour?.name ?? '—'}</td>
                  <td className="px-4 py-2 hidden md:table-cell text-gray-600">
                    {sched?.departure_at
                      ? DATETIME.format(new Date(sched.departure_at))
                      : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {PRICE.format(b.total_cents / 100)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/reserva/${b.booking_code}`}
                      target="_blank"
                      className="text-[rgb(9,110,171)] hover:underline text-xs"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Mostrando até 500 reservas. Use os filtros pra refinar.
      </p>
    </div>
  );
}
