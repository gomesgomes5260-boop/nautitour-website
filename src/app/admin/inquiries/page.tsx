import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';

export const dynamic = 'force-dynamic';

type InquiryStatus = Database['public']['Enums']['inquiry_status'];

const STATUS_LABEL: Record<InquiryStatus, { label: string; cls: string; dot: string }> = {
  new: {
    label: 'Novo',
    cls: 'bg-amber-50 text-amber-800',
    dot: 'bg-amber-500',
  },
  contacted: {
    label: 'Contactado',
    cls: 'bg-sky-50 text-sky-700',
    dot: 'bg-sky-500',
  },
  won: {
    label: 'Ganho',
    cls: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  lost: {
    label: 'Perdido',
    cls: 'bg-[var(--color-charcoal-100)] text-[var(--color-charcoal-700)]',
    dot: 'bg-[var(--color-charcoal-400)]',
  },
};

const DATETIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const DATE_ONLY = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

type Search = { status?: string };

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const status = sp.status as InquiryStatus | '' | undefined;

  const admin = createAdminClient();

  // Counts pra chips.
  const { data: allForCounts } = await admin
    .from('inquiry_requests')
    .select('status');
  const counts: Record<InquiryStatus | 'all', number> = {
    all: allForCounts?.length ?? 0,
    new: 0,
    contacted: 0,
    won: 0,
    lost: 0,
  };
  for (const row of allForCounts ?? []) {
    const s = row.status as InquiryStatus;
    counts[s] = (counts[s] ?? 0) + 1;
  }

  // Lista filtrada.
  let q = admin
    .from('inquiry_requests')
    .select(
      `
      id,
      status,
      requested_date,
      start_time,
      end_time,
      passenger_count,
      interested_in_open_bar,
      whatsapp_contacted_at,
      created_at,
      customer:customers ( full_name, email, phone ),
      tour:tours ( name )
      `
    )
    .order('created_at', { ascending: false })
    .limit(500);

  if (status) {
    q = q.eq('status', status);
  }

  const { data, error } = await q;

  type Joined = {
    id: string;
    status: InquiryStatus;
    requested_date: string | null;
    start_time: string | null;
    end_time: string | null;
    passenger_count: number | null;
    interested_in_open_bar: boolean;
    whatsapp_contacted_at: string | null;
    created_at: string;
    customer:
      | { full_name: string | null; email: string; phone: string | null }
      | { full_name: string | null; email: string; phone: string | null }[]
      | null;
    tour: { name: string } | { name: string }[] | null;
  };
  const rows = (data ?? []) as unknown as Joined[];

  const FILTERS: Array<{ value: string; label: string; count: number }> = [
    { value: '', label: 'Todos', count: counts.all },
    { value: 'new', label: 'Novos', count: counts.new },
    { value: 'contacted', label: 'Contactados', count: counts.contacted },
    { value: 'won', label: 'Ganhos', count: counts.won },
    { value: 'lost', label: 'Perdidos', count: counts.lost },
  ];

  return (
    <div>
      <h1
        className="font-display font-semibold text-[var(--color-charcoal-900)] tracking-tight mb-6"
        style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
      >
        Inquiries de locação
      </h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => {
          const active = (status ?? '') === f.value;
          return (
            <Link
              key={f.value}
              href={f.value ? `/admin/inquiries?status=${f.value}` : '/admin/inquiries'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                active
                  ? 'bg-[var(--color-red-50)] border-[var(--color-red-600)] text-[var(--color-red-600)]'
                  : 'bg-white text-[var(--color-charcoal-700)] border-[var(--color-charcoal-200)] hover:border-[var(--color-charcoal-300)] hover:bg-[var(--color-charcoal-50)]'
              }`}
            >
              {f.label}
              <span
                className={`text-xs font-semibold tabular-nums ${
                  active
                    ? 'text-[var(--color-red-700)]'
                    : 'text-[var(--color-charcoal-500)]'
                }`}
              >
                {f.count}
              </span>
            </Link>
          );
        })}
      </div>

      {error && (
        <div className="bg-[var(--color-red-50)] border border-[var(--color-red-100)] text-[var(--color-red-900)] rounded-xl p-3 mb-4 text-sm">
          Erro: {error.message}
        </div>
      )}

      <div className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-charcoal-50)] text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-charcoal-500)]">
            <tr>
              <th className="px-4 py-3">Recebido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3 hidden md:table-cell">Contato</th>
              <th className="px-4 py-3">Data desejada</th>
              <th className="px-4 py-3 text-center">Pax</th>
              <th className="px-4 py-3">Status</th>
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
                  Nenhum inquiry neste filtro.
                </td>
              </tr>
            )}
            {rows.map((i) => {
              const cust = Array.isArray(i.customer) ? i.customer[0] : i.customer;
              const st = STATUS_LABEL[i.status];
              return (
                <tr
                  key={i.id}
                  className="border-t border-[var(--color-charcoal-100)] hover:bg-[var(--color-charcoal-50)]/60"
                >
                  <td className="px-4 py-3 text-[var(--color-charcoal-500)] text-xs">
                    {DATETIME.format(new Date(i.created_at))}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-charcoal-900)]">
                    {cust?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-[var(--color-charcoal-700)] text-xs">
                    {cust?.phone ?? cust?.email ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-charcoal-900)]">
                    {i.requested_date
                      ? DATE_ONLY.format(new Date(`${i.requested_date}T12:00:00`))
                      : '—'}
                    {i.start_time && i.end_time ? (
                      <span className="ml-2 text-xs text-[var(--color-charcoal-500)] font-mono">
                        {i.start_time.slice(0, 5)}–{i.end_time.slice(0, 5)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-center text-[var(--color-charcoal-900)] tabular-nums">
                    {i.passenger_count ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${st.cls}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} aria-hidden />
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/inquiries/${i.id}`}
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
        Até 500 últimos inquiries.
      </p>
    </div>
  );
}
