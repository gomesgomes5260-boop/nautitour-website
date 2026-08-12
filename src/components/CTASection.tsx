import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import Container from './Container';

// Foto aérea da escuna em João Fernandes (pedido do admin 12/ago — antes o
// fundo era só o gradiente escuro). O gradient-iron fica por trás como
// fallback enquanto a imagem carrega.
const CTA_BG = '/images/photos/aerea/drone-joao-fernandes-01.jpg';

export default function CTASection() {
  return (
    <section
      className="relative overflow-hidden py-16 sm:py-20 md:py-28 lg:py-32"
      style={{ background: 'var(--gradient-iron)' }}
    >
      <Image
        src={CTA_BG}
        alt=""
        fill
        className="object-cover"
        sizes="100vw"
        aria-hidden
      />
      {/* Overlay escuro pra manter o contraste do texto sobre a foto */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(31,31,31,0.72) 0%, rgba(31,31,31,0.55) 50%, rgba(31,31,31,0.72) 100%)',
        }}
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
              textShadow: '0 2px 18px rgba(0,0,0,0.45)',
            }}
          >
            A melhor experiência
            <br />
            <span className="italic font-medium text-white/90">de passeio em Búzios.</span>
          </h2>
          <p
            className="text-white/85 text-sm sm:text-base md:text-lg mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed"
            style={{ textShadow: '0 1px 10px rgba(0,0,0,0.5)' }}
          >
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
