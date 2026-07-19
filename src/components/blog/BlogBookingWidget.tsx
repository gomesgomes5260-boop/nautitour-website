'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sailboat, Ship, MessageCircle, Star } from 'lucide-react';
import DateScheduleSelector from '../DateScheduleSelector';

type Schedule = {
  id: string;
  departure_at: string;
  capacity: number;
  seats_taken: number;
  price_cents: number | null;
  status: string;
  pier: { slug: string; name: string; fee_cents: number } | null;
};

type Props = {
  escunaSchedules: Schedule[];
  escunaPriceCents: number | null;
  postTitle: string;
};

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatPrice(cents: number | null | undefined) {
  if (cents == null) return null;
  return PRICE_FORMATTER.format(cents / 100);
}

export default function BlogBookingWidget({
  escunaSchedules,
  escunaPriceCents,
  postTitle,
}: Props) {
  const [tour, setTour] = useState<'escuna' | 'lancha'>('escuna');

  return (
    <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white overflow-hidden shadow-[var(--shadow-2)]">
      {/* Tour switch */}
      <div className="grid grid-cols-2 border-b border-[var(--color-charcoal-100)]">
        <button
          type="button"
          onClick={() => setTour('escuna')}
          aria-pressed={tour === 'escuna'}
          className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            tour === 'escuna'
              ? 'bg-[var(--color-red-600)] text-white'
              : 'bg-white text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)]'
          }`}
        >
          <Sailboat size={16} />
          Escuna
        </button>
        <button
          type="button"
          onClick={() => setTour('lancha')}
          aria-pressed={tour === 'lancha'}
          className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            tour === 'lancha'
              ? 'bg-[var(--color-red-600)] text-white'
              : 'bg-white text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)]'
          }`}
        >
          <Ship size={16} />
          Lancha
        </button>
      </div>

      {tour === 'escuna' ? (
        <>
          <div className="p-5 sm:p-6 border-b border-[var(--color-charcoal-100)]">
            <div className="flex items-center gap-1.5 mb-2">
              <Star
                size={13}
                className="fill-[var(--color-red-600)] text-[var(--color-red-600)]"
              />
              <span className="font-sans font-bold text-sm text-[var(--color-charcoal-900)]">
                4.9
              </span>
              <span className="text-xs text-[var(--color-charcoal-500)]">
                · 280+ passageiros
              </span>
            </div>
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-charcoal-500)] mb-0.5">
              A partir de
            </p>
            <p className="font-sans text-2xl sm:text-3xl font-black text-[var(--color-red-600)] leading-tight">
              {formatPrice(escunaPriceCents) ?? 'Sob consulta'}
              <span className="text-sm font-normal text-[var(--color-charcoal-500)]">
                {' '}/ pessoa
              </span>
            </p>
          </div>
          <div className="p-5 sm:p-6">
            <h3 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-charcoal-700)] mb-4">
              Escolha sua data
            </h3>
            <DateScheduleSelector
              schedules={escunaSchedules}
              fallbackPriceCents={escunaPriceCents}
              pricingMode="per_passenger"
              soldOutLabel="Esgotado"
            />
          </div>
        </>
      ) : (
        <div className="p-5 sm:p-6">
          <span className="inline-block text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)] mb-3">
            Passeio privativo
          </span>
          <h3 className="font-display text-[var(--color-charcoal-900)] text-xl sm:text-2xl font-semibold leading-tight mb-3">
            Lancha sob demanda.
          </h3>
          <p className="text-sm text-[var(--color-charcoal-600)] leading-relaxed mb-5">
            Roteiro flexível, até 12 pessoas, com comandante e bebidas inclusas.
            Te respondemos no WhatsApp com horários e orçamento.
          </p>
          <a
            href={`/api/wa?s=blog&t=${encodeURIComponent(postTitle)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-[var(--color-red-600)] text-white text-sm font-semibold py-3 hover:bg-[var(--color-red-700)] transition-colors"
          >
            <MessageCircle size={16} />
            Solicitar orçamento
          </a>
          <Link
            href="/passeio-lancha"
            className="block text-center text-xs font-semibold text-[var(--color-charcoal-600)] hover:text-[var(--color-red-600)] mt-3 transition-colors"
          >
            Ver detalhes da lancha →
          </Link>
        </div>
      )}
    </div>
  );
}
