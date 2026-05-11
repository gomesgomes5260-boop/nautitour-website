import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const TIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
});

function brtTodayISO(): string {
  const now = new Date();
  const brt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const yyyy = brt.getFullYear();
  const mm = String(brt.getMonth() + 1).padStart(2, '0');
  const dd = String(brt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default async function ManifestoIndex({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const date = sp.date || brtTodayISO();

  // BRT day window converted to UTC. BRT = UTC-3 (sem DST desde 2019).
  const fromUtc = new Date(`${date}T00:00:00-03:00`).toISOString();
  const nextDay = new Date(`${date}T00:00:00-03:00`);
  nextDay.setDate(nextDay.getDate() + 1);
  const toIso = nextDay.toISOString();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('tour_schedules')
    .select(
      `
      id,
      departure_at,
      capacity,
      seats_taken,
      status,
      tour:tours ( name, slug )
    `
    )
    .gte('departure_at', fromUtc)
    .lt('departure_at', toIso)
    .order('departure_at', { ascending: true });

  type Joined = {
    id: string;
    departure_at: string;
    capacity: number;
    seats_taken: number;
    status: string;
    tour: { name: string; slug: string } | { name: string; slug: string }[] | null;
  };
  const rows = (data ?? []) as unknown as Joined[];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Manifesto</h1>
      <form className="bg-white border border-gray-200 rounded-md p-4 mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Data</label>
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <button
          type="submit"
          className="bg-[rgb(9,110,171)] text-white text-sm px-4 py-1.5 rounded hover:opacity-90"
        >
          Buscar
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3 mb-4 text-sm">
          Erro: {error.message}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-2">Horário</th>
              <th className="px-4 py-2">Tour</th>
              <th className="px-4 py-2 text-center">Ocupação</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  Nenhuma saída em {date}.
                </td>
              </tr>
            )}
            {rows.map((s) => {
              const tour = Array.isArray(s.tour) ? s.tour[0] : s.tour;
              return (
                <tr key={s.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono">
                    {TIME.format(new Date(s.departure_at))}
                  </td>
                  <td className="px-4 py-2">{tour?.name ?? '—'}</td>
                  <td className="px-4 py-2 text-center">
                    {s.seats_taken} / {s.capacity}
                  </td>
                  <td className="px-4 py-2 capitalize">{s.status}</td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/manifesto/${s.id}`}
                      className="text-[rgb(9,110,171)] hover:underline"
                    >
                      Ver manifesto
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
