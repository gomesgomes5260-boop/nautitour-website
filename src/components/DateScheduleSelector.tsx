'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin } from 'lucide-react';

type SchedulePier = {
  slug: string;
  name: string;
  fee_cents: number;
};

type Schedule = {
  id: string;
  departure_at: string;
  capacity: number;
  seats_taken: number;
  price_cents: number | null;
  status: string;
  pier?: SchedulePier | null;
};

type Props = {
  schedules: Schedule[];
  fallbackPriceCents: number | null;
  pricingMode?: 'per_passenger' | 'per_slot';
  soldOutLabel?: string;
};

const TZ = 'America/Sao_Paulo';
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_LONG = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: TZ });
const FULL_DATE = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  timeZone: TZ,
});
const PRICE = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatPrice(cents: number | null | undefined): string | null {
  if (cents == null) return null;
  return PRICE.format(cents / 100);
}

/** YYYY-MM-DD em BRT a partir de uma data UTC. */
function dayKey(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: TZ,
  }).format(d);
}

/** Constrói Date pra meia-noite BRT (UTC-3) de uma string YYYY-MM-DD. */
function brtMidnight(year: number, month: number, day: number): Date {
  // Cria date em UTC e ajusta — Búzios é UTC-3 (sem horário de verão desde 2019).
  return new Date(Date.UTC(year, month, day, 3, 0, 0));
}

function hourMinute(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  }).format(new Date(iso));
}

export default function DateScheduleSelector({
  schedules,
  fallbackPriceCents,
  pricingMode = 'per_passenger',
  soldOutLabel = 'Esgotado',
}: Props) {
  // === Agrupa schedules por dia (key 'YYYY-MM-DD' em BRT) ===
  const byDay = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    for (const s of schedules) {
      const key = dayKey(new Date(s.departure_at));
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    // Ordena horários dentro de cada dia
    for (const arr of map.values()) {
      arr.sort((a, b) => a.departure_at.localeCompare(b.departure_at));
    }
    return map;
  }, [schedules]);

  // Dias com pelo menos uma saída disponível
  const availableDays = useMemo(() => {
    const days: string[] = [];
    for (const [key, list] of byDay) {
      if (list.some((s) => s.status !== 'sold_out' && s.capacity - s.seats_taken > 0)) {
        days.push(key);
      }
    }
    days.sort();
    return days;
  }, [byDay]);

  // === State: mês visível + data selecionada ===
  const initialDate = availableDays[0] ?? dayKey(new Date());
  const [year0, month0] = initialDate.split('-').map(Number);
  const [viewMonth, setViewMonth] = useState({ year: year0, monthIndex: month0 - 1 });
  const [selectedKey, setSelectedKey] = useState<string | null>(availableDays[0] ?? null);

  const monthLabel = useMemo(() => {
    const d = brtMidnight(viewMonth.year, viewMonth.monthIndex, 1);
    return MONTH_LONG.format(d);
  }, [viewMonth]);

  // Pode ir pra trás? Só se o mês visível for posterior ao mês do primeiro dia disponível
  const canPrev = useMemo(() => {
    if (availableDays.length === 0) return false;
    const [py, pm] = availableDays[0].split('-').map(Number);
    return viewMonth.year > py || (viewMonth.year === py && viewMonth.monthIndex > pm - 1);
  }, [viewMonth, availableDays]);

  // Pode avançar? Só se o mês visível for anterior ao mês do último dia disponível
  const canNext = useMemo(() => {
    if (availableDays.length === 0) return false;
    const [ny, nm] = availableDays[availableDays.length - 1].split('-').map(Number);
    return viewMonth.year < ny || (viewMonth.year === ny && viewMonth.monthIndex < nm - 1);
  }, [viewMonth, availableDays]);

  // === Constrói o grid do mês ===
  const days = useMemo(() => {
    const first = brtMidnight(viewMonth.year, viewMonth.monthIndex, 1);
    // Pra Búzios UTC-3, a meia-noite local = 03:00 UTC. getUTCDay() funciona.
    const firstWeekday = new Date(first).getUTCDay();
    // Último dia do mês: dia 0 do mês seguinte
    const lastDay = new Date(
      Date.UTC(viewMonth.year, viewMonth.monthIndex + 1, 0, 3, 0, 0)
    ).getUTCDate();

    const cells: Array<{ day: number; key: string } | null> = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= lastDay; d++) {
      const key = `${viewMonth.year}-${String(viewMonth.monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, key });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);

  const todayKey = dayKey(new Date());
  const selectedSchedules = selectedKey ? byDay.get(selectedKey) ?? [] : [];

  const selectedDateLabel = useMemo(() => {
    if (!selectedKey) return null;
    const [y, m, d] = selectedKey.split('-').map(Number);
    return FULL_DATE.format(brtMidnight(y, m - 1, d));
  }, [selectedKey]);

  function shiftMonth(delta: number) {
    setViewMonth((m) => {
      const total = m.year * 12 + m.monthIndex + delta;
      return { year: Math.floor(total / 12), monthIndex: total % 12 };
    });
  }

  // Empty state
  if (schedules.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-[var(--color-charcoal-50)] p-6 text-center">
        <CalendarIcon size={24} className="mx-auto text-[var(--color-charcoal-400)] mb-2" />
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
    <div className="space-y-4">
      {/* === Calendário === */}
      <div>
        {/* Header mês */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => canPrev && shiftMonth(-1)}
            disabled={!canPrev}
            aria-label="Mês anterior"
            className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-sans text-sm font-bold text-[var(--color-charcoal-900)] capitalize">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => canNext && shiftMonth(1)}
            disabled={!canNext}
            aria-label="Próximo mês"
            className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--color-charcoal-400)] text-center"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((cell, i) => {
            if (cell == null) return <div key={i} />;
            const dayList = byDay.get(cell.key) ?? [];
            const hasAvailable = dayList.some(
              (s) => s.status !== 'sold_out' && s.capacity - s.seats_taken > 0
            );
            const allSoldOut = dayList.length > 0 && !hasAvailable;
            const isSelected = cell.key === selectedKey;
            const isToday = cell.key === todayKey;

            let className =
              'relative h-9 flex items-center justify-center text-[13px] font-semibold rounded-md transition-colors';

            if (isSelected) {
              className += ' bg-[var(--color-red-600)] text-white shadow-[var(--shadow-1)]';
            } else if (hasAvailable) {
              className +=
                ' bg-[var(--color-red-50)] text-[var(--color-charcoal-900)] hover:bg-[var(--color-red-100)] cursor-pointer';
            } else if (allSoldOut) {
              className +=
                ' text-[var(--color-charcoal-300)] line-through cursor-not-allowed';
            } else {
              className += ' text-[var(--color-charcoal-300)] cursor-default';
            }

            const disabled = !hasAvailable;

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => !disabled && setSelectedKey(cell.key)}
                disabled={disabled}
                aria-label={cell.key}
                aria-pressed={isSelected}
                className={className}
              >
                <span>{cell.day}</span>
                {isToday && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--color-red-600)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--color-charcoal-500)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[var(--color-red-50)] border border-[var(--color-red-100)]" />
            Disponível
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[var(--color-red-600)]" />
            Selecionado
          </span>
        </div>
      </div>

      {/* === Horários do dia selecionado === */}
      {selectedKey ? (
        <div className="rounded-xl bg-[var(--color-charcoal-50)] p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-charcoal-500)]">
            Horários disponíveis
          </p>
          <p className="font-display text-base font-semibold text-[var(--color-charcoal-900)] capitalize mb-3">
            {selectedDateLabel}
          </p>
          <ul className="space-y-1.5">
            {selectedSchedules.map((s) => {
              const seatsLeft = s.capacity - s.seats_taken;
              const isSoldOut = s.status === 'sold_out' || seatsLeft <= 0;
              const price = formatPrice(s.price_cents) ?? formatPrice(fallbackPriceCents);
              const time = hourMinute(s.departure_at);
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
                  key={s.id}
                  className={`bg-white rounded-lg px-3 py-2.5 border ${
                    isSoldOut ? 'border-[var(--color-charcoal-100)] opacity-60' : 'border-[var(--color-charcoal-100)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm font-bold text-[var(--color-charcoal-900)] leading-tight">
                        Saída {time}
                      </p>
                      <p className={`text-xs font-semibold mt-0.5 ${statusColor}`}>
                        {status}
                        {price && !isSoldOut && (
                          <span className="font-normal text-[var(--color-charcoal-500)]"> · {price}</span>
                        )}
                      </p>
                    </div>
                    {isSoldOut ? (
                      <span className="font-sans text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--color-charcoal-400)] px-2 py-1.5 shrink-0">
                        {soldOutLabel}
                      </span>
                    ) : (
                      <Link
                        href={`/checkout/${s.id}`}
                        className="inline-flex items-center gap-1 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white font-bold text-xs px-3 py-2 rounded-full transition-colors shrink-0"
                      >
                        Reservar
                        <ChevronRight size={12} />
                      </Link>
                    )}
                  </div>
                  {s.pier && (
                    <div className="mt-2 pt-2 border-t border-[var(--color-charcoal-100)] flex items-start gap-1.5">
                      <MapPin size={11} className="mt-0.5 text-[var(--color-charcoal-500)] shrink-0" />
                      <p className="text-[11px] text-[var(--color-charcoal-500)] leading-snug">
                        Embarque · <span className="font-semibold text-[var(--color-charcoal-700)]">{s.pier.name}</span>
                        {s.pier.fee_cents > 0 && (
                          <span className="ml-1 text-[var(--color-red-700)] font-semibold">
                            (taxa R$ {(s.pier.fee_cents / 100).toFixed(2).replace('.', ',')}/pax presencial)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--color-charcoal-50)] p-4 text-center">
          <p className="text-sm text-[var(--color-charcoal-500)]">
            Selecione uma data no calendário pra ver os horários.
          </p>
        </div>
      )}
    </div>
  );
}
