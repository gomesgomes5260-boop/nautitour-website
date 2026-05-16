'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Container from './Container';
import type { Photo } from '@/lib/photo-gallery';

type Props = {
  photos: Photo[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
};

export default function PhotoGallery({ photos, eyebrow, title, subtitle }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const scrollByCards = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    // Avança ~70% da largura visível pra ter overlap suave.
    const delta = el.clientWidth * 0.7 * direction;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const open = (i: number) => setLightboxIndex(i);
  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)),
    [photos.length]
  );
  const next = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length)),
    [photos.length]
  );

  // Teclado: ESC fecha, setas navegam. Só ativo quando lightbox aberta.
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    // Trava scroll do body enquanto lightbox aberta.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxIndex, close, prev, next]);

  return (
    <section className="w-full bg-white py-14 sm:py-16 md:py-24">
      <Container>
        {(eyebrow || title || subtitle) && (
          <div className="text-center mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto">
            {eyebrow && (
              <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)]">
                {eyebrow}
              </span>
            )}
            {title && (
              <h2
                className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mt-3"
                style={{ fontSize: 'clamp(1.5rem, 4.5vw, 2.75rem)', lineHeight: '1.1', letterSpacing: '-0.02em' }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-[var(--color-charcoal-500)] text-sm md:text-base mt-3">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="relative">
          {/* Setas (desktop) */}
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            aria-label="Foto anterior"
            className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-[var(--color-charcoal-100)] shadow-[var(--shadow-2)] items-center justify-center text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            aria-label="Próxima foto"
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-[var(--color-charcoal-100)] shadow-[var(--shadow-2)] items-center justify-center text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] transition-colors"
          >
            <ChevronRight size={18} />
          </button>

          {/* Scroller horizontal com snap */}
          <div
            ref={scrollerRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 scrollbar-hide"
            style={{ scrollbarWidth: 'none' }}
          >
            {photos.map((photo, i) => (
              <button
                key={photo.src}
                type="button"
                onClick={() => open(i)}
                aria-label={`Abrir foto: ${photo.alt}`}
                className="group relative shrink-0 snap-start overflow-hidden rounded-2xl bg-[var(--color-charcoal-100)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-red-600)] focus-visible:ring-offset-2"
                style={{ width: 'clamp(220px, 36vw, 320px)', aspectRatio: '4 / 3' }}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 640px) 60vw, (max-width: 1024px) 36vw, 320px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      </Container>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      )}
    </section>
  );
}

function Lightbox({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return; // ignora taps
    if (dx > 0) onPrev();
    else onNext();
  };

  const current = photos[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visualização ampliada da galeria"
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Botão fechar (canto sup direito) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Fechar"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur"
      >
        <X size={20} />
      </button>

      {/* Contador */}
      <span className="absolute top-4 left-4 sm:top-6 sm:left-6 text-white/80 text-xs sm:text-sm font-mono bg-white/10 backdrop-blur px-3 py-1.5 rounded-full">
        {index + 1} / {photos.length}
      </span>

      {/* Prev */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        aria-label="Foto anterior"
        className="hidden sm:flex absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-colors backdrop-blur"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Next */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label="Próxima foto"
        className="hidden sm:flex absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-colors backdrop-blur"
      >
        <ChevronRight size={24} />
      </button>

      {/* Imagem */}
      <div
        className="relative w-full h-full max-w-6xl max-h-[85vh] mx-4 sm:mx-12"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={current.src}
          alt={current.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-contain"
          priority
        />
      </div>

      {/* Caption */}
      <p className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-white/85 text-xs sm:text-sm max-w-md text-center px-4">
        {current.alt}
      </p>
    </div>
  );
}
