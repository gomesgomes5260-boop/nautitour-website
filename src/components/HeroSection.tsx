import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Star, Clock, Users } from 'lucide-react';
import Container from './Container';

export default function HeroSection() {
  return (
    <>
      {/* === HERO === */}
      <section className="relative w-full overflow-hidden">
        <Image
          src="/images/photos/escuna/escuna-pier-01.jpg"
          alt="Passeio de Escuna em Búzios"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(110deg, rgba(31,31,31,0.82) 0%, rgba(31,31,31,0.6) 40%, rgba(31,31,31,0.25) 75%, rgba(31,31,31,0.1) 100%)',
          }}
        />

        <Container className="relative py-20 sm:py-24 md:py-28 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-7">
              <span className="inline-block text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-300)] mb-5">
                Búzios · Região dos Lagos
              </span>
              <h1
                className="font-display text-white font-semibold tracking-tight mb-5 sm:mb-7"
                style={{
                  fontSize: 'clamp(1.875rem, 7vw, 5rem)',
                  lineHeight: '1.08',
                  letterSpacing: '-0.02em',
                }}
              >
                A vista é nossa.
                <br />
                <span className="italic font-medium text-white/90">A história, sua.</span>
              </h1>
              <p className="text-white/85 text-sm sm:text-base md:text-lg leading-relaxed mb-8 max-w-xl">
                Passeios de escuna e lancha pelas 12 praias mais bonitas e 3 ilhas paradisíacas. Embarque tranquilo e curta.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/passeio-escuna"
                  className="inline-flex items-center justify-center gap-2 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white font-bold text-sm md:text-base px-6 py-3.5 rounded-full transition-colors"
                >
                  Reservar agora
                  <ChevronRight size={16} />
                </Link>
                <Link
                  href="#tours"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 font-bold text-sm md:text-base px-6 py-3.5 rounded-full transition-colors"
                >
                  Ver passeios
                </Link>
              </div>
            </div>

            {/* Card flutuante */}
            <aside className="lg:col-span-5 w-full lg:max-w-sm lg:ml-auto">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)] overflow-hidden border border-white/20">
                <div className="relative aspect-[16/9]">
                  <Image
                    src="/images/photos/misc/cruzeiro-vista-01.jpg"
                    alt="Próxima saída"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 90vw, 380px"
                  />
                  <span className="absolute top-3 left-3 bg-[var(--color-red-600)] text-white text-[10px] font-bold tracking-[0.06em] uppercase px-2.5 py-1 rounded-full">
                    Próxima saída
                  </span>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Star size={13} className="fill-[var(--color-red-600)] text-[var(--color-red-600)]" />
                    <span className="font-sans font-bold text-xs sm:text-sm text-[var(--color-charcoal-900)]">4.9</span>
                    <span className="font-sans text-xs text-[var(--color-charcoal-500)]">· 280+ passageiros</span>
                  </div>
                  <h3
                    className="font-display font-semibold text-[var(--color-charcoal-900)] tracking-tight mb-3"
                    style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', lineHeight: '1.15' }}
                  >
                    Escuna · 12 praias
                  </h3>
                  <div className="flex flex-col gap-1.5 mb-5 text-xs sm:text-sm text-[var(--color-charcoal-500)]">
                    <span className="inline-flex items-center gap-2">
                      <Clock size={13} /> 10h às 16h · 6h de passeio
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Users size={13} /> Até 30 pessoas a bordo
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-3 pt-4 border-t border-[var(--color-charcoal-100)]">
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-charcoal-500)]">
                        A partir de
                      </p>
                      <p className="font-sans text-xl sm:text-2xl font-black text-[var(--color-red-600)] leading-tight">
                        R$60
                        <span className="text-xs font-normal text-[var(--color-charcoal-500)]"> /pessoa</span>
                      </p>
                    </div>
                    <Link
                      href="/passeio-escuna"
                      className="inline-flex items-center gap-1 bg-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-900)] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full transition-colors whitespace-nowrap"
                    >
                      Reservar
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
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
              imgSrc="/images/photos/misc/cruzeiro-vista-01.jpg"
              imgAlt="Lancha privativa em Búzios"
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
