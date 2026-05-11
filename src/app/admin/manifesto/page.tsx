import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const TIME_FMT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
});

function brtToday(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

function parseMonthParam(raw: string | undefined): { year: number; month: number } {
  const today = brtToday();
  if (!raw) return { year: today.year, month: today.month };
  const m = raw.match(/^(\d{4})-(\d{2})$/);
  if (!m) return { year: today.year, month: today.month };
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return { year: today.year, month: today.month };
  return { year: y, month: mo };
}

function monthLabel(y: number, m: number): string {
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function shiftMonth(y: number, m: number, delta: number): string {
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Maps fill ratio to Tailwind classes (no libs).
function cellColors(seats: number, capacity: number, cancelled: boolean) {
  if (cancelled) return 'bg-gray-200 text-gray-500 line-through';
  if (capacity <= 0) return 'bg-gray-100 text-gray-600';
  const pct = seats / capacity;
  if (seats === 0) return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  if (pct < 0.3) return 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200';
  if (pct < 0.7) return 'bg-emerald-500 text-white hover:bg-emerald-600';
  if (pct < 0.95) return 'bg-amber-500 text-white hover:bg-amber-600';
  return 'bg-red-600 text-white hover:bg-red-700';
}

type ScheduleCell = {
  id: string;
  departure_at: string;
  capacity: number;
  seats_taken: number;
  status: string;
  tour_name: string;
};

export default async function ManifestoIndex({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const { year, month } = parseMonthParam(sp.month);

  // BRT month bounds → UTC.
  const fromIso = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00-03:00`).toISOString();
  const nextMonthFirst = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00-03:00`);
  nextMonthFirst.setUTCMonth(nextMonthFirst.getUTCMonth() + 1);
  const toIso = nextMonthFirst.toISOString();

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
      tour:tours ( name )
      `
    )
    .gte('departure_at', fromIso)
    .lt('departure_at', toIso)
    .order('departure_at', { ascending: true });

  type Joined = {
    id: string;
    departure_at: string;
    capacity: number;
    seats_taken: number;
    status: string;
    tour: { name: string } | { name: string }[] | null;
  };
  const rows = (data ?? []) as unknown as Joined[];
  const schedules: ScheduleCell[] = rows.map((r) => {
    const t = Array.isArray(r.tour) ? r.tour[0] : r.tour;
    return {
      id: r.id,
      departure_at: r.departure_at,
      capacity: r.capacity,
      seats_taken: r.seats_taken,
      status: r.status,
      tour_name: t?.name ?? '—',
    };
  });

  // Bucket schedules per day key (YYYY-MM-DD in BRT).
  const byDay = new Map<string, ScheduleCell[]>();
  for (const s of schedules) {
    const d = new Date(s.departure_at);
    const dayKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
    const arr = byDay.get(dayKey) ?? [];
    arr.push(s);
    byDay.set(dayKey, arr);
  }

  // Build calendar grid: pad first row up to weekday of day 1.
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = firstOfMonth.getUTCDay(); // 0=Sun
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const today = brtToday();

  const prevMonth = shiftMonth(year, month, -1);
  const nextMonth = shiftMonth(year, month, +1);

  const totalSchedules = schedules.length;
  const totalSeats = schedules.reduce((acc, s) => acc + (s.status === 'cancelled' ? 0 : s.capacity), 0);
  const bookedSeats = schedules.reduce((acc, s) => acc + (s.status === 'cancelled' ? 0 : s.seats_taken), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Agenda · {monthLabel(year, month)}</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/manifesto?month=${prevMonth}`}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
          >
            ← Mês anterior
          </Link>
          <Link
            href="/admin/manifesto"
            className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
          >
            Hoje
          </Link>
          <Link
            href={`/admin/manifesto?month=${nextMonth}`}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
          >
            Próximo mês →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
        <div className="border border-gray-200 rounded p-3 bg-white">
          <div className="text-xs uppercase text-gray-500">Saídas no mês</div>
          <div className="text-xl font-semibold">{totalSchedules}</div>
        </div>
        <div className="border border-gray-200 rounded p-3 bg-white">
          <div className="text-xs uppercase text-gray-500">Capacidade total</div>
          <div className="text-xl font-semibold">{totalSeats}</div>
        </div>
        <div className="border border-gray-200 rounded p-3 bg-white">
          <div className="text-xs uppercase text-gray-500">Reservados</div>
          <div className="text-xl font-semibold">
            {bookedSeats}{' '}
            <span className="text-sm font-normal text-gray-500">
              ({totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3 mb-4 text-sm">
          Erro: {error.message}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="grid grid-cols-7 text-xs uppercase text-gray-600 bg-gray-50 border-b border-gray-200">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: totalCells }).map((_, i) => {
            const dayNumber = i - firstWeekday + 1;
            const valid = dayNumber >= 1 && dayNumber <= daysInMonth;
            if (!valid) {
              return (
                <div
                  key={i}
                  className="min-h-[110px] border-r border-b border-gray-100 bg-gray-50/40"
                />
              );
            }
            const dayKey = `${year}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
            const list = byDay.get(dayKey) ?? [];
            const isToday =
              today.year === year && today.month === month && today.day === dayNumber;

            return (
              <div
                key={i}
                className={`min-h-[110px] border-r border-b border-gray-100 p-1.5 ${
                  isToday ? 'bg-red-50/30' : ''
                }`}
              >
                <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-red-700' : 'text-gray-700'}`}>
                  {dayNumber}
                </div>
                <div className="space-y-1">
                  {list.map((s) => {
                    const cls = cellColors(
                      s.seats_taken,
                      s.capacity,
                      s.status === 'cancelled'
                    );
                    const pct = s.capacity > 0
                      ? Math.round((s.seats_taken / s.capacity) * 100)
                      : 0;
                    return (
                      <Link
                        key={s.id}
                        href={`/admin/manifesto/${s.id}`}
                        className={`block rounded px-1.5 py-1 text-[11px] leading-tight ${cls} transition-colors`}
                        title={`${s.tour_name} · ${s.seats_taken}/${s.capacity}`}
                      >
                        <div className="font-mono">{TIME_FMT.format(new Date(s.departure_at))}</div>
                        <div className="truncate">{s.tour_name}</div>
                        <div className="font-semibold">{s.seats_taken}/{s.capacity} · {pct}%</div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-700">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-gray-100 border border-gray-200" /> Vazia
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-emerald-100" /> &lt;30%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-emerald-500" /> 30–69%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-amber-500" /> 70–94%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-red-600" /> ≥95% / esgotado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-gray-200" /> Cancelada
        </span>
      </div>
    </div>
  );
}
