import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Container from './Container';

export default function CTASection() {
  return (
    <section
      className="relative overflow-hidden py-16 sm:py-20 md:py-28 lg:py-32"
      style={{ background: 'var(--gradient-iron)' }}
    >
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent 0, transparent 24px, rgba(255,255,255,0.5) 24px, rgba(255,255,255,0.5) 25px)',
        }}
      />
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-25 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-red-600) 0%, transparent 70%)' }}
      />

      <Container className="relative">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-300)] mb-5">
            Vem embarcar
          </span>
          <h2
            className="font-display text-white font-semibold tracking-tight mb-5 sm:mb-6"
            style={{
              fontSize: 'clamp(1.875rem, 6vw, 4rem)',
              lineHeight: '1.08',
              letterSpacing: '-0.02em',
            }}
          >
            A melhor experiência
            <br />
            <span className="italic font-medium text-white/90">de passeio em Búzios.</span>
          </h2>
          <p className="text-white/75 text-sm sm:text-base md:text-lg mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed">
            12 praias, 3 ilhas, sol o dia todo. Seguro, divertido e com o melhor atendimento da Região dos Lagos.
          </p>
          <Link
            href="/passeio-escuna"
            className="inline-flex items-center gap-2 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white font-bold text-sm sm:text-base px-7 sm:px-8 py-4 rounded-full transition-colors"
          >
            Ver datas e reservar
            <ChevronRight size={18} />
          </Link>
        </div>
      </Container>
    </section>
  );
}
