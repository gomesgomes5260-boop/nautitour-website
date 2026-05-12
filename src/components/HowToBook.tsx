import { Compass, CreditCard, Sailboat } from 'lucide-react';
import Container from './Container';

type Step = {
  num: string;
  Icon: typeof Compass;
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    num: '01',
    Icon: Compass,
    title: 'Escolha',
    description:
      'Decida em 1 minuto. Navegue pelos passeios e escolha entre a escuna ou a lancha privativa. Tudo claro, sem letras miúdas.',
  },
  {
    num: '02',
    Icon: CreditCard,
    title: 'Pague online',
    description:
      'PIX, cartão de crédito (até 6x) ou direto pelo WhatsApp. Voucher chega no seu e-mail e WhatsApp na hora.',
  },
  {
    num: '03',
    Icon: Sailboat,
    title: 'Embarque',
    description:
      'É só chegar na nossa loja, apresentar o voucher no celular e começar a navegar. Sem fila, sem estresse.',
  },
];

export default function HowToBook() {
  return (
    <section className="bg-[var(--color-charcoal-50)] py-16 sm:py-20 md:py-28">
      <Container>
        <div className="text-center mb-12 md:mb-16 max-w-xl mx-auto">
          <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)]">
            Como funciona
          </span>
          <h2
            className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mt-3 mb-3 sm:mb-4"
            style={{ fontSize: 'clamp(1.75rem, 5.5vw, 3.5rem)', lineHeight: '1.1', letterSpacing: '-0.02em' }}
          >
            Reservar é fácil e rápido.
          </h2>
          <p className="text-[var(--color-charcoal-500)] text-sm sm:text-base md:text-lg leading-relaxed">
            3 passos pra sair do clique pro embarque. Sem complicação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
          {steps.map((step) => (
            <article
              key={step.num}
              className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6 sm:p-7 md:p-8"
            >
              <div className="flex items-center gap-4 mb-5">
                <span
                  className="font-display font-semibold text-[var(--color-red-600)] leading-none"
                  style={{ fontSize: 'clamp(2.25rem, 6vw, 3.5rem)' }}
                >
                  {step.num}
                </span>
                <span className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[var(--color-red-50)] text-[var(--color-red-600)]">
                  <step.Icon size={22} />
                </span>
              </div>
              <h3 className="font-sans text-lg sm:text-xl font-bold text-[var(--color-charcoal-900)] mb-2">
                {step.title}
              </h3>
              <p className="text-[var(--color-charcoal-500)] text-sm sm:text-base leading-relaxed">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
