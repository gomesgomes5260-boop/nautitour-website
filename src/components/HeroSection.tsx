import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <>
      {/* Hero full-bleed com foto e overlay charcoal */}
      <section className="relative w-full h-[78vh] min-h-[560px] max-h-[820px] overflow-hidden">
        <Image
          src="/images/photos/escuna/escuna-pier-01.jpg"
          alt="Passeio de Escuna em Búzios"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay charcoal pra legibilidade do texto */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(31,31,31,0.78) 0%, rgba(31,31,31,0.55) 45%, rgba(31,31,31,0.15) 100%)',
          }}
        />

        <div className="relative h-full max-w-7xl mx-auto px-6 md:px-12 flex items-center">
          <div className="max-w-2xl">
            <span className="inline-block text-[11px] md:text-xs font-bold tracking-[0.22em] uppercase text-[var(--color-red-300)] mb-4">
              Búzios · Região dos Lagos
            </span>
            <h1
              className="font-display text-white text-5xl md:text-7xl font-semibold leading-[1.05] tracking-tight mb-6"
              style={{ letterSpacing: '-0.02em' }}
            >
              A vista é nossa.
              <br />
              <span className="italic font-medium text-white/90">A história, sua.</span>
            </h1>
            <p className="text-white/90 text-base md:text-lg leading-relaxed mb-8 max-w-xl">
              Passeios de escuna e lancha pelas 12 praias mais bonitas e 3 ilhas paradisíacas. Tudo claro, sem letras miúdas — embarque tranquilo e curta.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/passeio-escuna"
                className="inline-flex items-center justify-center gap-2 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white font-bold text-sm md:text-base px-7 py-3.5 rounded-full transition-colors"
              >
                Reservar agora
                <ChevronRight size={18} />
              </Link>
              <Link
                href="#tours"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 font-bold text-sm md:text-base px-7 py-3.5 rounded-full transition-colors"
              >
                Ver passeios
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tour cards row — estilo brand guide */}
      <section id="tours" className="w-full bg-white py-16 md:py-24 px-5 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 md:mb-14 max-w-2xl">
            <span className="text-xs font-bold tracking-[0.22em] uppercase text-[var(--color-red-600)]">
              Nossos passeios
            </span>
            <h2 className="font-display text-[var(--color-charcoal-900)] text-4xl md:text-5xl font-semibold tracking-tight mt-3 mb-4">
              Escolha sua aventura.
            </h2>
            <p className="text-[var(--color-charcoal-500)] text-base md:text-lg">
              Dois jeitos de navegar Búzios: a animação do grupo na escuna, ou a exclusividade da lancha privativa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
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
              theme="charcoal"
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
              theme="red"
              cta="Consultar"
            />
          </div>
        </div>
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
  theme: 'charcoal' | 'red';
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
  theme,
  cta,
}: TourCardProps) {
  const overlayColor =
    theme === 'charcoal' ? 'rgba(31,31,31,0.55)' : 'rgba(192,0,16,0.55)';
  const badgeClass =
    badgeStyle === 'dark'
      ? 'bg-[var(--color-charcoal-700)] text-white'
      : 'bg-[var(--color-red-600)] text-white';

  return (
    <article className="bg-white rounded-2xl overflow-hidden border border-[var(--color-charcoal-100)] shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)] transition-shadow">
      <div className="relative aspect-[5/3] overflow-hidden">
        <Image src={imgSrc} alt={imgAlt} fill className="object-cover" />
        <div className="absolute inset-0" style={{ backgroundColor: overlayColor }} />
        <span
          className={`absolute top-4 left-4 ${badgeClass} font-sans text-[10px] md:text-[11px] font-bold uppercase tracking-[0.06em] px-3 py-1.5 rounded-full`}
        >
          {badge}
        </span>
      </div>
      <div className="p-6 md:p-7">
        <h3 className="font-display text-2xl md:text-3xl font-semibold text-[var(--color-charcoal-900)] tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-sm text-[var(--color-charcoal-500)] mb-6">{meta}</p>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-[var(--color-charcoal-500)] mb-0.5">A partir de</p>
            <div className="flex items-baseline gap-2">
              {priceStrike && (
                <span className="text-sm text-[var(--color-charcoal-300)] line-through">
                  {priceStrike}
                </span>
              )}
              <span className="font-sans text-3xl font-black text-[var(--color-red-600)]">
                {priceFrom}
              </span>
              {pricePer && (
                <span className="text-sm text-[var(--color-charcoal-500)]">{pricePer}</span>
              )}
            </div>
          </div>
          <Link
            href={href}
            className="inline-flex items-center gap-2 bg-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-900)] text-white font-bold text-sm px-5 py-3 rounded-full transition-colors"
          >
            {cta}
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
