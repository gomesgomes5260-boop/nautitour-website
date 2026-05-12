import Link from 'next/link';
import { ChevronRight, Calendar } from 'lucide-react';

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

type Schedule = {
  id: string;
  departure_at: string;
  capacity: number;
  seats_taken: number;
  price_cents: number | null;
  status: string;
};

type Props = {
  schedules: Schedule[];
  fallbackPriceCents: number | null;
  /** Texto quando o booking é por slot (lancha) vs por pessoa (escuna). */
  pricingMode?: 'per_passenger' | 'per_slot';
  /** Texto de status para "vagas tomadas" (default 'Esgotado'). Lancha usa 'Reservado'. */
  soldOutLabel?: string;
};

function formatBRLFromCents(cents: number | null | undefined) {
  if (cents == null) return null;
  return PRICE_FORMATTER.format(cents / 100);
}

function dateParts(iso: string) {
  const d = new Date(iso);
  const tz = 'America/Sao_Paulo';
  const day = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', timeZone: tz }).format(d);
  const monthShort = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: tz })
    .format(d)
    .replace('.', '')
    .toLowerCase();
  const weekdayShort = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: tz })
    .format(d)
    .replace('.', '')
    .toLowerCase();
  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
  }).format(d);
  return { day, monthShort, weekdayShort, time };
}

export default function ScheduleListCard({
  schedules,
  fallbackPriceCents,
  pricingMode = 'per_passenger',
  soldOutLabel = 'Esgotado',
}: Props) {
  if (schedules.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-[var(--color-charcoal-50)] p-6 text-center">
        <Calendar size={24} className="mx-auto text-[var(--color-charcoal-400)] mb-2" />
        <p className="text-sm text-[var(--color-charcoal-700)] font-semibold mb-1">
          Sem saídas disponíveis no momento.
        </p>
        <p className="text-xs text-[var(--color-charcoal-500)]">
          Fale com a gente pelo WhatsApp pra verificar próximas datas.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {schedules.map((schedule) => {
        const isSoldOut =
          schedule.status === 'sold_out' || schedule.capacity - schedule.seats_taken <= 0;
        const seatsLeft = schedule.capacity - schedule.seats_taken;
        const price =
          formatBRLFromCents(schedule.price_cents) ??
          formatBRLFromCents(fallbackPriceCents);
        const { day, monthShort, weekdayShort, time } = dateParts(schedule.departure_at);

        const status = isSoldOut
          ? soldOutLabel
          : pricingMode === 'per_slot'
            ? 'Disponível'
            : `${seatsLeft} vaga${seatsLeft === 1 ? '' : 's'}`;

        const statusColor = isSoldOut
          ? 'text-[var(--color-charcoal-400)]'
          : seatsLeft <= 3 && pricingMode === 'per_passenger'
            ? 'text-[var(--color-red-600)]'
            : 'text-[var(--color-success)]';

        return (
          <li
            key={schedule.id}
            className={`group flex items-center gap-4 rounded-2xl border bg-white p-3 sm:p-4 transition-all ${
              isSoldOut
                ? 'border-[var(--color-charcoal-100)] opacity-60'
                : 'border-[var(--color-charcoal-100)] hover:border-[var(--color-charcoal-300)] hover:shadow-[var(--shadow-2)]'
            }`}
          >
            {/* Date block — dia grande, mês e weekday pequenos */}
            <div className="flex flex-col items-center justify-center w-14 sm:w-16 shrink-0 rounded-xl bg-[var(--color-charcoal-50)] py-2.5 px-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--color-charcoal-500)] leading-none">
                {monthShort}
              </span>
              <span
                className="font-display text-2xl sm:text-3xl font-semibold text-[var(--color-charcoal-900)] leading-none mt-0.5"
                style={{ letterSpacing: '-0.01em' }}
              >
                {day}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--color-charcoal-500)] leading-none mt-1">
                {weekdayShort}
              </span>
            </div>

            {/* Meta + price */}
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm sm:text-base font-bold text-[var(--color-charcoal-900)]">
                Saída {time}
              </p>
              <p className={`text-xs sm:text-sm font-semibold ${statusColor}`}>
                {status}
                {price && !isSoldOut && (
                  <span className="font-normal text-[var(--color-charcoal-500)]"> · {price}</span>
                )}
              </p>
            </div>

            {/* CTA */}
            {isSoldOut ? (
              <span className="font-sans text-xs font-bold uppercase tracking-[0.06em] text-[var(--color-charcoal-400)] px-3 py-2 shrink-0">
                {soldOutLabel}
              </span>
            ) : (
              <Link
                href={`/checkout/${schedule.id}`}
                className="inline-flex items-center gap-1 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-full transition-colors shrink-0"
              >
                Reservar
                <ChevronRight size={14} />
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
