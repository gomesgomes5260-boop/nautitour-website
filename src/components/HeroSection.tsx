import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Container from './Container';

export default function HeroSection() {
  return (
    <>
      {/* === HERO === */}
      <section className="relative w-full overflow-hidden min-h-[82vh] md:min-h-[90vh] flex flex-col">
        <Image
          src="/images/photos/aerea/drone-tartaruga-01.jpg"
          alt="Búzios visto do alto"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Overlay sutil — só escurece os extremos pra legibilidade, deixa o meio limpo */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(31,31,31,0.55) 0%, rgba(31,31,31,0.1) 25%, rgba(31,31,31,0) 55%, rgba(31,31,31,0.35) 85%, rgba(31,31,31,0.7) 100%)',
          }}
        />

        <Container className="relative flex-1 flex flex-col py-8 sm:py-10 md:py-14">
          {/* === Texto no topo === */}
          <div className="max-w-3xl">
            <span className="inline-block text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-300)] mb-4 sm:mb-5">
              Búzios · Região dos Lagos
            </span>
            <h1
              className="font-display text-white font-semibold tracking-tight mb-4 sm:mb-6"
              style={{
                fontSize: 'clamp(2rem, 7.5vw, 5.5rem)',
                lineHeight: '1.05',
                letterSpacing: '-0.025em',
                textShadow: '0 2px 24px rgba(0,0,0,0.35)',
              }}
            >
              A vista é nossa.
              <br />
              <span className="italic font-medium text-white/90">A história, sua.</span>
            </h1>
            <p
              className="text-white/90 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl"
              style={{ textShadow: '0 1px 12px rgba(0,0,0,0.35)' }}
            >
              Passeios de escuna e lancha pelas 12 praias mais bonitas e 3 ilhas paradisíacas. Embarque tranquilo e curta.
            </p>
          </div>

          {/* === Botões no rodapé === */}
          <div className="mt-auto pt-12 flex flex-col sm:flex-row gap-3 max-w-3xl">
            <Link
              href="/passeio-escuna"
              className="inline-flex items-center justify-center gap-2 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white font-bold text-sm md:text-base px-7 py-4 rounded-full transition-colors shadow-lg shadow-black/20"
            >
              Reservar agora
              <ChevronRight size={16} />
            </Link>
            <Link
              href="#tours"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 font-bold text-sm md:text-base px-7 py-4 rounded-full transition-colors"
            >
              Ver passeios
            </Link>
          </div>
        </Container>
      </section>

      {/* === TOURS === */}
      <section id="tours" className="w-full bg-white py-16 sm:py-20 md:py-28">
        <Container>
          <div className="mb-10 sm:mb-12 md:mb-16 max-w-2xl">
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)]">
              Nossos passeios
            </span>
            <h2
              className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mt-3 mb-3 sm:mb-4"
              style={{ fontSize: 'clamp(1.75rem, 5.5vw, 3.5rem)', lineHeight: '1.1', letterSpacing: '-0.02em' }}
            >
              Escolha sua aventura.
            </h2>
            <p className="text-[var(--color-charcoal-500)] text-sm sm:text-base md:text-lg leading-relaxed">
              Dois jeitos de navegar Búzios: a animação do grupo na escuna, ou a exclusividade da lancha privativa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 md:gap-8">
            <TourCard
              href="/passeio-escuna"
              title="Passeio de Escuna em Búzios"
              meta="10h–16h · 6h · 12 praias, 3 ilhas"
              priceFrom="R$60"
              pricePer="/ pessoa"
              priceStrike="R$70,00"
              imgSrc="/images/photos/escuna/escuna-pier-01.jpg"
              imgAlt="Escuna em Búzios"
              badge="Mais procurado"
              badgeStyle="dark"
              cta="Ver datas"
            />
            <TourCard
              href="/passeio-lancha"
              title="Lancha Privativa 3h"
              meta="Saída flexível · até 8 pessoas · roteiro custom"
              priceFrom="R$1.200"
              imgSrc="/images/photos/ilhas/grupo-snorkel-01.jpg"
              imgAlt="Grupo fazendo snorkel em Búzios"
              badge="Privativo"
              badgeStyle="red"
              cta="Consultar"
            />
          </div>
        </Container>
      </section>
    </>
  );
}

type TourCardProps = {
  href: string;
  title: string;
  meta: string;
  priceFrom: string;
  pricePer?: string;
  priceStrike?: string;
  imgSrc: string;
  imgAlt: string;
  badge: string;
  badgeStyle: 'dark' | 'red';
  cta: string;
};

function TourCard({
  href,
  title,
  meta,
  priceFrom,
  pricePer,
  priceStrike,
  imgSrc,
  imgAlt,
  badge,
  badgeStyle,
  cta,
}: TourCardProps) {
  const badgeClass =
    badgeStyle === 'dark'
      ? 'bg-[var(--color-charcoal-900)] text-white'
      : 'bg-[var(--color-red-600)] text-white';

  return (
    <article className="group bg-white rounded-2xl overflow-hidden border border-[var(--color-charcoal-100)] shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-3)] hover:border-[var(--color-charcoal-200)] transition-all duration-300">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={imgSrc}
          alt={imgAlt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(31,31,31,0.5) 0%, rgba(31,31,31,0.1) 50%, rgba(31,31,31,0) 100%)',
          }}
        />
        <span
          className={`absolute top-4 left-4 ${badgeClass} font-sans text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full`}
        >
          {badge}
        </span>
      </div>
      <div className="p-6 md:p-8">
        <h3
          className="font-display font-semibold text-[var(--color-charcoal-900)] tracking-tight mb-2 sm:mb-3"
          style={{ fontSize: 'clamp(1.375rem, 3.5vw, 2rem)', lineHeight: '1.2', letterSpacing: '-0.015em' }}
        >
          {title}
        </h3>
        <p className="text-xs sm:text-sm md:text-base text-[var(--color-charcoal-500)] mb-5 sm:mb-6">{meta}</p>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-charcoal-500)] mb-1">
              A partir de
            </p>
            <div className="flex items-baseline gap-2 flex-wrap">
              {priceStrike && (
                <span className="text-xs sm:text-sm text-[var(--color-charcoal-300)] line-through">
                  {priceStrike}
                </span>
              )}
              <span className="font-sans text-2xl sm:text-3xl font-black text-[var(--color-red-600)]">
                {priceFrom}
              </span>
              {pricePer && (
                <span className="text-xs sm:text-sm text-[var(--color-charcoal-500)]">{pricePer}</span>
              )}
            </div>
          </div>
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 bg-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-900)] text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-full transition-colors"
          >
            {cta}
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
