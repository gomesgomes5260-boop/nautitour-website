import Link from 'next/link';
import { CalendarCheck, Users, Banknote, Wallet } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import KpiCard from '@/components/KpiCard';

export const dynamic = 'force-dynamic';

const PRICE = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const DATE_TIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export default async function VendedorDashboardPage() {
  // Client user-scoped de propósito: a RLS bookings_seller_select é a
  // barreira que limita a leitura às reservas do próprio vendedor (ou dos
  // sellers da agência).
  const supabase = await createClient();

  // Início do mês em BRT (UTC-3)
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 3600_000);
  const monthStart = new Date(
    Date.UTC(brt.getUTCFullYear(), brt.getUTCMonth(), 1, 3, 0, 0)
  ).toISOString();

  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      'id, booking_code, status, passenger_count, total_cents, amount_paid_cents, created_at, schedule:tour_schedules ( departure_at )'
    )
    .not('seller_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200);

  type Row = {
    id: string;
    booking_code: string;
    status: string;
    passenger_count: number;
    total_cents: number;
    amount_paid_cents: number;
    created_at: string;
    schedule: { departure_at: string } | { departure_at: string }[] | null;
  };
  const rows = (bookings ?? []) as unknown as Row[];
  const active = rows.filter((b) => b.status === 'confirmed' || b.status === 'completed');
  const monthRows = active.filter((b) => b.created_at >= monthStart);

  const monthCount = monthRows.length;
  const monthPax = monthRows.reduce((acc, b) => acc + b.passenger_count, 0);
  const monthSales = monthRows.reduce((acc, b) => acc + b.total_cents, 0);
  const monthPaid = monthRows.reduce((acc, b) => acc + b.amount_paid_cents, 0);

  const recent = rows.slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-charcoal-900)]">Painel do vendedor</h1>
          <p className="text-sm text-[var(--color-charcoal-500)] mt-1">
            Suas vendas deste mês e reservas recentes.
          </p>
        </div>
        <Link
          href="/vendedor/reservas/nova"
          className="rounded-xl bg-[var(--color-red-600)] text-white text-sm font-semibold py-2.5 px-5 hover:bg-[var(--color-red-700)] transition-colors"
        >
          Nova reserva
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard Icon={CalendarCheck} label="Reservas no mês" value={String(monthCount)} />
        <KpiCard Icon={Users} label="Passageiros no mês" value={String(monthPax)} />
        <KpiCard Icon={Banknote} label="Vendas no mês" value={PRICE.format(monthSales / 100)} />
        <KpiCard
          Icon={Wallet}
          label="Sinal recebido no mês"
          value={PRICE.format(monthPaid / 100)}
        />
      </div>

      <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-charcoal-100)]">
          <h2 className="text-sm font-bold text-[var(--color-charcoal-900)]">Reservas recentes</h2>
          <Link
            href="/vendedor/reservas"
            className="text-xs font-semibold text-[var(--color-red-600)] hover:underline"
          >
            Ver todas
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[var(--color-charcoal-500)]">
            Nenhuma reserva ainda. Crie a primeira em “Nova reserva”.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-charcoal-100)]">
            {recent.map((b) => {
              const schedule = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
              return (
                <li key={b.id}>
                  <Link
                    href={`/vendedor/reservas/${b.booking_code}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 hover:bg-[var(--color-charcoal-50)] transition-colors"
                  >
                    <span className="font-mono text-sm font-semibold text-[var(--color-charcoal-900)]">
                      {b.booking_code}
                    </span>
                    <span className="text-xs text-[var(--color-charcoal-500)]">
                      {schedule?.departure_at
                        ? `Saída ${DATE_TIME.format(new Date(schedule.departure_at))}`
                        : 'Sem saída'}
                    </span>
                    <span className="text-xs text-[var(--color-charcoal-700)]">
                      {b.passenger_count} pax
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-charcoal-900)]">
                      {PRICE.format(b.total_cents / 100)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
