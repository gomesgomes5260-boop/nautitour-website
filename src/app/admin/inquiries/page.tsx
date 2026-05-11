import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';

export const dynamic = 'force-dynamic';

type InquiryStatus = Database['public']['Enums']['inquiry_status'];

const STATUS_LABEL: Record<InquiryStatus, { label: string; cls: string }> = {
  new: { label: 'Novo', cls: 'bg-amber-100 text-amber-800' },
  contacted: { label: 'Contactado', cls: 'bg-blue-100 text-blue-800' },
  won: { label: 'Ganho', cls: 'bg-green-100 text-green-800' },
  lost: { label: 'Perdido', cls: 'bg-gray-100 text-gray-700' },
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
      <h1 className="text-2xl font-semibold mb-6">Inquiries de locação</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => {
          const active = (status ?? '') === f.value;
          return (
            <Link
              key={f.value}
              href={f.value ? `/admin/inquiries?status=${f.value}` : '/admin/inquiries'}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                active
                  ? 'bg-[rgb(9,110,171)] text-white border-[rgb(9,110,171)]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {f.label} <span className="opacity-70">· {f.count}</span>
            </Link>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3 mb-4 text-sm">
          Erro: {error.message}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-2">Recebido</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2 hidden md:table-cell">Contato</th>
              <th className="px-4 py-2">Data desejada</th>
              <th className="px-4 py-2 text-center">Pax</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Nenhum inquiry neste filtro.
                </td>
              </tr>
            )}
            {rows.map((i) => {
              const cust = Array.isArray(i.customer) ? i.customer[0] : i.customer;
              const st = STATUS_LABEL[i.status];
              return (
                <tr key={i.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-600 text-xs">
                    {DATETIME.format(new Date(i.created_at))}
                  </td>
                  <td className="px-4 py-2">{cust?.full_name ?? '—'}</td>
                  <td className="px-4 py-2 hidden md:table-cell text-gray-700 text-xs">
                    {cust?.phone ?? cust?.email ?? '—'}
                  </td>
                  <td className="px-4 py-2">
                    {i.requested_date
                      ? DATE_ONLY.format(new Date(`${i.requested_date}T12:00:00`))
                      : '—'}
                    {i.start_time && i.end_time ? (
                      <span className="ml-2 text-xs text-gray-500 font-mono">
                        {i.start_time.slice(0, 5)}–{i.end_time.slice(0, 5)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {i.passenger_count ?? '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${st.cls}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/inquiries/${i.id}`}
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
      <p className="text-xs text-gray-500 mt-2">Até 500 últimos inquiries.</p>
    </div>
  );
}
