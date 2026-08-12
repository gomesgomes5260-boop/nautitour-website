import { ShieldCheck, Wine, Globe2 } from 'lucide-react';
import Container from './Container';
import CertificationBadges from './CertificationBadges';

type Feature = {
  Icon: typeof ShieldCheck;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    Icon: ShieldCheck,
    title: 'Segurança certificada',
    description:
      'Embarcações seguindo as normas da Marinha. Coletes para todos e marinheiros experientes.',
  },
  {
    Icon: Wine,
    title: 'Bar a bordo',
    description:
      'Caipirinhas, petiscos frescos e drinks tropicais (opcional). Brinde à vista perfeita.',
  },
  {
    Icon: Globe2,
    title: 'Guias bilíngues',
    description:
      'Atendemos turistas do mundo todo. Português e Espanhol pra ninguém perder a história local.',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-white py-16 sm:py-20 md:py-28">
      <Container>
        <div className="mb-12 md:mb-16 max-w-2xl">
          <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)]">
            Por que a Nautitour
          </span>
          <h2
            className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mt-3 mb-3 sm:mb-4"
            style={{ fontSize: 'clamp(1.75rem, 5.5vw, 3.5rem)', lineHeight: '1.1', letterSpacing: '-0.02em' }}
          >
            Estrutura completa pra você relaxar.
          </h2>
          <p className="text-[var(--color-charcoal-500)] text-sm sm:text-base md:text-lg leading-relaxed">
            Segurança, diversão e atendimento bom de verdade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 mb-14 sm:mb-16 md:mb-20">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col">
              <span className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[var(--color-red-50)] text-[var(--color-red-600)] mb-4">
                <feature.Icon size={22} />
              </span>
              <h3 className="font-sans text-lg sm:text-xl font-bold text-[var(--color-charcoal-900)] mb-2">
                {feature.title}
              </h3>
              <p className="text-[var(--color-charcoal-500)] text-sm sm:text-base leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--color-charcoal-100)] pt-10 sm:pt-12 md:pt-16">
          <p className="text-center text-[var(--color-charcoal-700)] text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] mb-8">
            Certificados pelos principais órgãos reguladores
          </p>
          <CertificationBadges />
        </div>
      </Container>
    </section>
  );
}

