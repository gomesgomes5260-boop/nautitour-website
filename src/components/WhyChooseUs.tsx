import Image from 'next/image';
import { ShieldCheck, Wine, Globe2 } from 'lucide-react';

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
      'Embarcações seguindo as normas da Marinha. Coletes para todos e marinheiros experientes garantindo um passeio 100% seguro.',
  },
  {
    Icon: Wine,
    title: 'Bar a bordo',
    description:
      'Caipirinhas, petiscos frescos e drinks tropicais (opcional). Você só se preocupa em brindar à vista perfeita.',
  },
  {
    Icon: Globe2,
    title: 'Guias bilíngues',
    description:
      'Atendemos turistas do mundo todo com hospitalidade calorosa. Português e Espanhol pra ninguém perder a história local.',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-white py-16 md:py-24 px-5 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 md:mb-16 max-w-2xl">
          <span className="text-xs font-bold tracking-[0.22em] uppercase text-[var(--color-red-600)]">
            Por que a Nautitour
          </span>
          <h2 className="font-display text-[var(--color-charcoal-900)] text-4xl md:text-5xl font-semibold tracking-tight mt-3 mb-4">
            Estrutura completa pra você relaxar.
          </h2>
          <p className="text-[var(--color-charcoal-500)] text-base md:text-lg">
            Segurança, diversão e atendimento bom de verdade. O passeio vira a melhor memória da viagem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 mb-16 md:mb-20">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col">
              <span className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-red-50)] text-[var(--color-red-600)] mb-5">
                <feature.Icon size={26} />
              </span>
              <h3 className="font-sans text-xl font-bold text-[var(--color-charcoal-900)] mb-2">
                {feature.title}
              </h3>
              <p className="text-[var(--color-charcoal-500)] text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--color-charcoal-100)] pt-12 md:pt-16">
          <p className="text-center text-[var(--color-charcoal-700)] text-sm font-semibold uppercase tracking-[0.18em] mb-8">
            Certificados pelos principais órgãos reguladores
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16">
            <Image src="/images/cert-buzios.png" alt="Certificação Búzios" width={120} height={120} />
            <Image src="/images/cert-cadastur.png" alt="Certificação CADASTUR" width={120} height={120} />
          </div>
        </div>
      </div>
    </section>
  );
}
