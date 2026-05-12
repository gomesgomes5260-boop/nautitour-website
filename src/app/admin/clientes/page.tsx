import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const PRICE = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const DATE = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const VIP_THRESHOLD_CENTS = 300000; // R$ 3.000,00

type Sort = 'spent' | 'recent' | 'count';

type Search = { q?: string; sort?: Sort };

function colorFromName(name: string): string {
  // Hash leve pra cor de avatar (sem libs)
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const palette = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
  ];
  return palette[Math.abs(h) % palette.length];
}

function initials(name: string | null, email: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default async function AdminClientesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const sort: Sort = sp.sort === 'recent' || sp.sort === 'count' ? sp.sort : 'spent';

  const admin = createAdminClient();

  // Tours pra filtrar tour-de-teste + identificar lancha (tour_type=private)
  const { data: toursRaw } = await admin
    .from('tours')
    .select('id, tour_type, is_test_only');
  const tourMap = new Map(
    (toursRaw ?? []).map((t) => [t.id, { type: t.tour_type, isTest: t.is_test_only }])
  );
  const testTourIds = new Set(
    (toursRaw ?? []).filter((t) => t.is_test_only).map((t) => t.id)
  );

  // Carrega bookings não-pendentes (count, spent, last_visit, lancha) excluindo
  // tour-de-teste. Aceita confirmed/completed/refunded como "ativo" pra histórico.
  const { data: bookingsRaw } = await admin
    .from('bookings')
    .select('id, customer_id, tour_id, total_cents, status, created_at')
    .in('status', ['confirmed', 'completed', 'refunded'])
    .order('created_at', { ascending: false });

  // Agrupa por customer (in-memory; volume aceitável pro Tier 2).
  type Agg = {
    bookings_count: number;
    total_spent_cents: number;
    last_booking_at: string;
    has_lancha: boolean;
  };
  const agg = new Map<string, Agg>();
  for (const b of bookingsRaw ?? []) {
    if (testTourIds.has(b.tour_id)) continue;
    const cur = agg.get(b.customer_id) ?? {
      bookings_count: 0,
      total_spent_cents: 0,
      last_booking_at: '1970-01-01',
      has_lancha: false,
    };
    cur.bookings_count += 1;
    cur.total_spent_cents += b.total_cents ?? 0;
    if (b.created_at > cur.last_booking_at) cur.last_booking_at = b.created_at;
    const tour = tourMap.get(b.tour_id);
    if (tour?.type === 'private') cur.has_lancha = true;
    agg.set(b.customer_id, cur);
  }

  const customerIds = Array.from(agg.keys());

  // Carrega dados básicos do customer
  let customers: Array<{
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    is_guest: boolean;
  }> = [];
  if (customerIds.length > 0) {
    let cq = admin
      .from('customers')
      .select('id, full_name, email, phone, is_guest')
      .in('id', customerIds);
    if (q) {
      cq = cq.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    }
    const { data } = await cq;
    customers = data ?? [];
  }

  // Combina + sort
  const rows = customers
    .map((c) => ({
      ...c,
      ...(agg.get(c.id) as Agg),
    }))
    .sort((a, b) => {
      if (sort === 'recent')
        return b.last_booking_at.localeCompare(a.last_booking_at);
      if (sort === 'count') return b.bookings_count - a.bookings_count;
      return b.total_spent_cents - a.total_spent_cents;
    })
    .slice(0, 50);

  // KPIs globais (sobre todos os customers, não só filtrados)
  const totalCustomers = customerIds.length;
  const recurrents = Array.from(agg.values()).filter((a) => a.bookings_count > 1).length;
  const totalSpentAll = Array.from(agg.values()).reduce(
    (acc, a) => acc + a.total_spent_cents,
    0
  );
  const totalBookings = Array.from(agg.values()).reduce(
    (acc, a) => acc + a.bookings_count,
    0
  );
  const avgTicket = totalBookings > 0 ? totalSpentAll / totalBookings : 0;

  const [{ count: guestCount }, { count: totalCustomerRows }] = await Promise.all([
    admin
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('is_guest', true),
    admin.from('customers').select('id', { count: 'exact', head: true }),
  ]);
  const guestPct =
    totalCustomerRows && totalCustomerRows > 0
      ? Math.round(((guestCount ?? 0) / totalCustomerRows) * 100)
      : 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Clientes</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi label="Clientes ativos" value={String(totalCustomers)} />
        <Kpi
          label="Recorrentes"
          value={String(recurrents)}
          sub={totalCustomers > 0 ? `${Math.round((recurrents / totalCustomers) * 100)}%` : '—'}
        />
        <Kpi label="Ticket médio" value={PRICE.format(avgTicket / 100)} />
        <Kpi
          label="Guests"
          value={`${guestPct}%`}
          sub={`${guestCount ?? 0} sem cadastro`}
        />
      </div>

      <form className="bg-white border border-gray-200 rounded-md p-4 mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-600 mb-1">
            Busca (nome ou e-mail)
          </label>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="ex: Gabriel ou gabriel@…"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Ordenar</label>
          <select
            name="sort"
            defaultValue={sort}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm"
          >
            <option value="spent">Maior gasto</option>
            <option value="recent">Mais recente</option>
            <option value="count">Mais reservas</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-[rgb(9,110,171)] text-white text-sm px-4 py-1.5 rounded hover:opacity-90"
        >
          Filtrar
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2 hidden md:table-cell">Contato</th>
              <th className="px-4 py-2 text-right">Reservas</th>
              <th className="px-4 py-2 text-right">Gasto total</th>
              <th className="px-4 py-2 hidden md:table-cell">Última</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Nenhum cliente encontrado{q && ` para "${q}"`}.
                </td>
              </tr>
            )}
            {rows.map((c) => {
              const tags: Array<{ label: string; cls: string }> = [];
              if (c.total_spent_cents >= VIP_THRESHOLD_CENTS) {
                tags.push({ label: 'VIP', cls: 'bg-amber-100 text-amber-800' });
              }
              if (c.bookings_count > 1) {
                tags.push({ label: 'Recorrente', cls: 'bg-emerald-100 text-emerald-800' });
              }
              if (c.has_lancha) {
                tags.push({ label: 'Lancha', cls: 'bg-blue-100 text-blue-800' });
              }
              const displayName = c.full_name || c.email;

              return (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div
                      className={`w-8 h-8 rounded-full text-white text-xs font-semibold flex items-center justify-center ${colorFromName(displayName)}`}
                      aria-hidden
                    >
                      {initials(c.full_name, c.email)}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-medium">{displayName}</div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tags.map((t) => (
                          <span
                            key={t.label}
                            className={`text-[10px] px-1.5 py-0.5 rounded ${t.cls}`}
                          >
                            {t.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 hidden md:table-cell text-xs text-gray-700">
                    {c.email}
                    {c.phone && <div className="text-gray-500">{c.phone}</div>}
                  </td>
                  <td className="px-4 py-2 text-right">{c.bookings_count}</td>
                  <td className="px-4 py-2 text-right font-mono font-semibold text-[rgb(217,0,6)]">
                    {PRICE.format(c.total_spent_cents / 100)}
                  </td>
                  <td className="px-4 py-2 hidden md:table-cell text-gray-600 text-xs">
                    {DATE.format(new Date(c.last_booking_at))}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/clientes/${c.id}`}
                      className="text-[rgb(9,110,171)] hover:underline text-xs"
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

      <p className="text-xs text-gray-500 mt-3">
        Top 50 clientes. Tour de teste excluído. KPIs do topo contam todos os
        clientes ativos (com pelo menos 1 reserva confirmada).
      </p>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}
