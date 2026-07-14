import Link from 'next/link';
import { Users, Repeat, BarChart3, UserX } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizePostgrestPattern } from '@/lib/postgrest-safe';
import Pagination from '@/components/Pagination';
import KpiCard from '@/components/KpiCard';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

function buildQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

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

type Search = { q?: string; sort?: Sort; page?: string };

// Paleta de avatares mantida com diferenciação visual (8 hues).
// Tom -500 consistente, paleta neutra-warm pra combinar com brand.
const AVATAR_PALETTE = [
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-fuchsia-500',
  'bg-teal-500',
  'bg-indigo-500',
];

function colorFromName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function initials(name: string | null, email: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

const inputClass =
  'w-full border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2 text-sm text-[var(--color-charcoal-900)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors';

export default async function AdminClientesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const sort: Sort = sp.sort === 'recent' || sp.sort === 'count' ? sp.sort : 'spent';
  const requestedPage = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

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
    const safeQ = sanitizePostgrestPattern(q);
    if (safeQ) {
      cq = cq.or(`full_name.ilike.%${safeQ}%,email.ilike.%${safeQ}%`);
    }
    const { data } = await cq;
    customers = data ?? [];
  }

  // Combina + sort (tiebreak por id garante ordem determinística pra paginação)
  const sortedRows = customers
    .map((c) => ({
      ...c,
      ...(agg.get(c.id) as Agg),
    }))
    .sort((a, b) => {
      if (sort === 'recent') {
        const cmp = b.last_booking_at.localeCompare(a.last_booking_at);
        return cmp !== 0 ? cmp : a.id.localeCompare(b.id);
      }
      if (sort === 'count') {
        const cmp = b.bookings_count - a.bookings_count;
        return cmp !== 0 ? cmp : a.id.localeCompare(b.id);
      }
      const cmp = b.total_spent_cents - a.total_spent_cents;
      return cmp !== 0 ? cmp : a.id.localeCompare(b.id);
    });

  const totalRows = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const rows = sortedRows.slice(offset, offset + PAGE_SIZE);

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
      <h1
        className="font-display font-semibold text-[var(--color-charcoal-900)] tracking-tight mb-6"
        style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
      >
        Clientes
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          Icon={Users}
          iconTone="bg-sky-50 text-sky-700"
          label="Clientes ativos"
          value={String(totalCustomers)}
        />
        <KpiCard
          Icon={Repeat}
          iconTone="bg-emerald-50 text-emerald-700"
          label="Recorrentes"
          value={String(recurrents)}
          sub={
            totalCustomers > 0
              ? `${Math.round((recurrents / totalCustomers) * 100)}%`
              : '—'
          }
        />
        <KpiCard
          Icon={BarChart3}
          iconTone="bg-[var(--color-red-50)] text-[var(--color-red-600)]"
          label="Ticket médio"
          value={PRICE.format(avgTicket / 100)}
        />
        <KpiCard
          Icon={UserX}
          iconTone="bg-amber-50 text-amber-700"
          label="Guests"
          value={`${guestPct}%`}
          sub={`${guestCount ?? 0} sem cadastro`}
        />
      </div>

      <form className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-5 mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-[var(--color-charcoal-700)] mb-1.5">
            Busca (nome ou e-mail)
          </label>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="ex: Gabriel ou gabriel@…"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-charcoal-700)] mb-1.5">
            Ordenar
          </label>
          <select name="sort" defaultValue={sort} className={inputClass}>
            <option value="spent">Maior gasto</option>
            <option value="recent">Mais recente</option>
            <option value="count">Mais reservas</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
        >
          Filtrar
        </button>
      </form>

      <div className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-charcoal-50)] text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-charcoal-500)]">
            <tr>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3 hidden md:table-cell">Contato</th>
              <th className="px-4 py-3 text-right">Reservas</th>
              <th className="px-4 py-3 text-right">Gasto total</th>
              <th className="px-4 py-3 hidden md:table-cell">Última</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-[var(--color-charcoal-500)]"
                >
                  Nenhum cliente encontrado{q && ` para "${q}"`}.
                </td>
              </tr>
            )}
            {rows.map((c) => {
              const tags: Array<{ label: string; cls: string }> = [];
              if (c.total_spent_cents >= VIP_THRESHOLD_CENTS) {
                tags.push({ label: 'VIP', cls: 'bg-amber-50 text-amber-800' });
              }
              if (c.bookings_count > 1) {
                tags.push({
                  label: 'Recorrente',
                  cls: 'bg-emerald-50 text-emerald-700',
                });
              }
              if (c.has_lancha) {
                tags.push({ label: 'Lancha', cls: 'bg-sky-50 text-sky-700' });
              }
              const displayName = c.full_name || c.email;

              return (
                <tr
                  key={c.id}
                  className="border-t border-[var(--color-charcoal-100)] hover:bg-[var(--color-charcoal-50)]/60"
                >
                  <td className="px-4 py-3">
                    <div
                      className={`w-8 h-8 rounded-full text-white text-xs font-semibold flex items-center justify-center ${colorFromName(displayName)}`}
                      aria-hidden
                    >
                      {initials(c.full_name, c.email)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--color-charcoal-900)]">
                      {displayName}
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tags.map((t) => (
                          <span
                            key={t.label}
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${t.cls}`}
                          >
                            {t.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-[var(--color-charcoal-700)]">
                    {c.email}
                    {c.phone && (
                      <div className="text-[var(--color-charcoal-500)]">{c.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-charcoal-900)] tabular-nums">
                    {c.bookings_count}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--color-red-600)]">
                    {PRICE.format(c.total_spent_cents / 100)}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-[var(--color-charcoal-500)] text-xs">
                    {DATE.format(new Date(c.last_booking_at))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/clientes/${c.id}`}
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalRows}
        pageSize={PAGE_SIZE}
        buildHref={(p) => buildQuery({ q, sort, page: p === 1 ? undefined : p })}
        itemLabel={{ singular: 'cliente', plural: 'clientes' }}
      />

      <p className="text-xs text-[var(--color-charcoal-500)] mt-3">
        Tour de teste excluído. KPIs do topo contam todos os clientes ativos
        (com pelo menos 1 reserva confirmada).
      </p>
    </div>
  );
}
