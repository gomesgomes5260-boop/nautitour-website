import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const PRICE = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const DATE_TIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

const METHOD_LABEL: Record<string, string> = {
  pix: 'PIX',
  cash: 'Dinheiro',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmada',
  completed: 'Embarcada',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
  pending_payment: 'Pendente',
};

export default async function VendedorReservaDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // Client user-scoped: se a reserva não é do vendedor (ou da agência dele),
  // a RLS esconde a row e a página responde 404.
  const supabase = await createClient();
  const { data: booking } = await supabase
    .from('bookings')
    .select(
      `
      id, booking_code, status, passenger_count, total_cents, amount_paid_cents,
      manual_payment_method, needs_pickup, pickup_address, pickup_room, notes,
      checked_in_at, created_at,
      schedule:tour_schedules ( departure_at, pier:embarkation_piers ( name, address ) ),
      tour:tours ( name ),
      passengers:booking_passengers ( full_name, is_child )
      `
    )
    .eq('booking_code', code)
    .maybeSingle();

  if (!booking) notFound();

  type PierJoined = { name: string; address: string | null };
  type Row = {
    id: string;
    booking_code: string;
    status: string;
    passenger_count: number;
    total_cents: number;
    amount_paid_cents: number;
    manual_payment_method: string | null;
    needs_pickup: boolean;
    pickup_address: string | null;
    pickup_room: string | null;
    notes: string | null;
    checked_in_at: string | null;
    created_at: string;
    schedule:
      | { departure_at: string; pier: PierJoined | PierJoined[] | null }
      | { departure_at: string; pier: PierJoined | PierJoined[] | null }[]
      | null;
    tour: { name: string } | { name: string }[] | null;
    passengers: { full_name: string; is_child: boolean }[] | null;
  };
  const b = booking as unknown as Row;
  const schedule = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
  const pier = schedule
    ? Array.isArray(schedule.pier)
      ? schedule.pier[0]
      : schedule.pier
    : null;
  const tour = Array.isArray(b.tour) ? b.tour[0] : b.tour;
  const remaining = b.total_cents - b.amount_paid_cents;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/vendedor/reservas"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-charcoal-500)] hover:text-[var(--color-charcoal-900)] mb-3"
        >
          <ArrowLeft size={14} /> Minhas reservas
        </Link>
        <h1 className="font-mono text-2xl font-bold text-[var(--color-charcoal-900)]">
          {b.booking_code}
        </h1>
        <p className="text-sm text-[var(--color-charcoal-500)] mt-1">
          {tour?.name} · {STATUS_LABEL[b.status] ?? b.status}
          {b.checked_in_at && ' · embarque realizado'}
        </p>
      </div>

      {(b.status === 'confirmed' || b.status === 'completed') && (
        <a
          href={`/ticket/${b.booking_code}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-red-600)] text-white text-sm font-semibold py-2.5 px-5 hover:bg-[var(--color-red-700)] transition-colors"
        >
          Ver ticket de embarque (envie ao cliente)
          <ExternalLink size={14} />
        </a>
      )}

      <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {schedule?.departure_at && (
            <Item label="Saída">
              <span className="capitalize">
                {DATE_TIME.format(new Date(schedule.departure_at))}
              </span>
            </Item>
          )}
          {pier && (
            <Item label="Embarque">
              {pier.name}
              {pier.address && (
                <span className="block text-xs text-[var(--color-charcoal-500)]">
                  {pier.address}
                </span>
              )}
            </Item>
          )}
          <Item label="Total">
            <strong>{PRICE.format(b.total_cents / 100)}</strong>
          </Item>
          <Item label="Sinal recebido">
            {PRICE.format(b.amount_paid_cents / 100)}
            {b.manual_payment_method && (
              <span className="block text-xs text-[var(--color-charcoal-500)]">
                {METHOD_LABEL[b.manual_payment_method] ?? b.manual_payment_method}
              </span>
            )}
          </Item>
          <Item label="Falta receber (presencial)">
            <span className={remaining > 0 ? 'text-[var(--color-red-600)] font-semibold' : ''}>
              {PRICE.format(Math.max(0, remaining) / 100)}
            </span>
          </Item>
          {b.needs_pickup && (
            <Item label="Pickup">
              {b.pickup_address}
              {b.pickup_room && (
                <span className="block text-xs text-[var(--color-charcoal-500)]">
                  Quarto {b.pickup_room}
                </span>
              )}
            </Item>
          )}
          {b.notes && (
            <Item label="Observações" full>
              {b.notes}
            </Item>
          )}
          <Item label="Passageiros" full>
            <ul className="space-y-0.5">
              {(b.passengers ?? []).map((p, i) => (
                <li key={i} className="text-sm">
                  {p.full_name}
                  {p.is_child && (
                    <span className="ml-2 text-xs text-[var(--color-charcoal-500)]">(meia)</span>
                  )}
                </li>
              ))}
            </ul>
          </Item>
        </dl>
      </div>
    </div>
  );
}

function Item({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? 'md:col-span-2' : undefined}>
      <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-charcoal-500)] mb-1">
        {label}
      </dt>
      <dd className="text-[var(--color-charcoal-900)]">{children}</dd>
    </div>
  );
}
