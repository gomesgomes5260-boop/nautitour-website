import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section
      className="relative overflow-hidden py-20 md:py-28 px-5 md:px-12"
      style={{ background: 'var(--gradient-iron)' }}
    >
      {/* Decorative pattern - subtle diagonal lines */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent 0, transparent 22px, rgba(255,255,255,0.5) 22px, rgba(255,255,255,0.5) 23px)',
        }}
      />

      <div className="relative max-w-4xl mx-auto text-center">
        <span className="inline-block text-xs font-bold tracking-[0.22em] uppercase text-[var(--color-red-300)] mb-5">
          Vem embarcar
        </span>
        <h2
          className="font-display text-white text-4xl md:text-6xl font-semibold tracking-tight mb-6"
          style={{ letterSpacing: '-0.02em' }}
        >
          A melhor experiência
          <br />
          de passeio em Búzios.
        </h2>
        <p className="text-white/80 text-base md:text-lg mb-10 max-w-2xl mx-auto">
          12 praias, 3 ilhas, sol o dia todo. Seguro, divertido e com o melhor atendimento da Região dos Lagos.
        </p>
        <Link
          href="/passeio-escuna"
          className="inline-flex items-center gap-2 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white font-bold text-base px-8 py-4 rounded-full transition-colors"
        >
          Ver datas e reservar
          <ChevronRight size={18} />
        </Link>
      </div>
    </section>
  );
}
