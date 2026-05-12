import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section
      className="relative overflow-hidden py-20 sm:py-24 md:py-32 lg:py-40 px-5 sm:px-6 md:px-10 lg:px-12"
      style={{ background: 'var(--gradient-iron)' }}
    >
      {/* Decorative pattern diagonal */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent 0, transparent 24px, rgba(255,255,255,0.5) 24px, rgba(255,255,255,0.5) 25px)',
        }}
      />
      {/* Soft red glow upper-right */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-25 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-red-600) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-4xl mx-auto text-center">
        <span className="inline-block text-xs font-bold tracking-[0.22em] uppercase text-[var(--color-red-300)] mb-5 md:mb-6">
          Vem embarcar
        </span>
        <h2
          className="font-display text-white font-semibold tracking-tight mb-6 md:mb-8 break-words"
          style={{
            fontSize: 'clamp(2.25rem, 7vw, 4.5rem)',
            lineHeight: '1.05',
            letterSpacing: '-0.025em',
          }}
        >
          A melhor experiência
          <br />
          <span className="italic font-medium text-white/90">de passeio em Búzios.</span>
        </h2>
        <p className="text-white/75 text-sm sm:text-base md:text-lg mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed">
          12 praias, 3 ilhas, sol o dia todo. Seguro, divertido e com o melhor atendimento da Região dos Lagos.
        </p>
        <Link
          href="/passeio-escuna"
          className="inline-flex items-center gap-2 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white font-bold text-sm sm:text-base md:text-lg px-8 sm:px-10 py-4 sm:py-5 rounded-full transition-colors"
        >
          Ver datas e reservar
          <ChevronRight size={20} />
        </Link>
      </div>
    </section>
  );
}
