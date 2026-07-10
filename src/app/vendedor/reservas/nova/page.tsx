import { createClient } from '@/lib/supabase/server';
import NovaReservaForm, { type ScheduleOption } from './NovaReservaForm';

export const dynamic = 'force-dynamic';

export default async function NovaReservaPage() {
  const supabase = await createClient();

  // Saídas abertas dos próximos 60 dias (leitura pública via RLS).
  const until = new Date(Date.now() + 60 * 24 * 3600_000).toISOString();
  const { data: schedules } = await supabase
    .from('tour_schedules')
    .select(
      'id, departure_at, capacity, seats_taken, price_cents, status, tour:tours ( name, tour_type, base_price_cents, active, is_test_only )'
    )
    .eq('status', 'open')
    .gte('departure_at', new Date().toISOString())
    .lte('departure_at', until)
    .order('departure_at');

  type Row = {
    id: string;
    departure_at: string;
    capacity: number;
    seats_taken: number;
    price_cents: number | null;
    status: string;
    tour:
      | { name: string; tour_type: string; base_price_cents: number | null; active: boolean; is_test_only: boolean }
      | { name: string; tour_type: string; base_price_cents: number | null; active: boolean; is_test_only: boolean }[]
      | null;
  };

  const options: ScheduleOption[] = ((schedules ?? []) as unknown as Row[])
    .map((s) => {
      const tour = Array.isArray(s.tour) ? s.tour[0] : s.tour;
      return { s, tour };
    })
    .filter(({ tour }) => tour && tour.active && tour.tour_type === 'scheduled')
    .map(({ s, tour }) => ({
      id: s.id,
      departureAt: s.departure_at,
      tourName: tour!.name,
      isTest: tour!.is_test_only,
      seatsAvailable: Math.max(0, s.capacity - s.seats_taken),
      unitPriceCents: s.price_cents ?? tour!.base_price_cents ?? null,
    }))
    .filter((o) => o.unitPriceCents != null && o.seatsAvailable > 0);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-charcoal-900)]">Nova reserva</h1>
        <p className="text-sm text-[var(--color-charcoal-500)] mt-1">
          Registre uma venda feita fora do site. O sinal recebido é a base da
          sua comissão, paga após o embarque.
        </p>
      </div>
      <NovaReservaForm schedules={options} />
    </div>
  );
}
