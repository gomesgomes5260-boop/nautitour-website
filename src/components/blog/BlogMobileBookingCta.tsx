'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import BlogBookingWidget from './BlogBookingWidget';

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

export default function BlogMobileBookingCta(props: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[var(--color-charcoal-100)] shadow-[0_-6px_18px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center justify-between gap-3 w-full px-4 py-3"
        >
          <span className="flex flex-col items-start">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-red-600)] leading-none">
              Reserve agora
            </span>
            <span className="font-sans text-sm font-bold text-[var(--color-charcoal-900)] leading-tight mt-1">
              Escolha sua data
            </span>
          </span>
          <span className="flex items-center gap-2 rounded-xl bg-[var(--color-red-600)] text-white text-sm font-semibold py-2.5 px-4">
            <CalendarDays size={16} />
            Agendar passeio
          </span>
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Agendar passeio"
          className="lg:hidden fixed inset-0 z-50"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto bg-[var(--color-charcoal-50)] rounded-t-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-3 bg-[var(--color-charcoal-50)] border-b border-[var(--color-charcoal-100)]">
              <h2 className="font-sans text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-charcoal-700)]">
                Agendar passeio
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white border border-[var(--color-charcoal-100)] text-[var(--color-charcoal-700)] hover:text-[var(--color-red-600)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <BlogBookingWidget {...props} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
