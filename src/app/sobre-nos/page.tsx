import Image from 'next/image';
import { ShieldCheck, LifeBuoy, Wine, Map, CreditCard, Anchor, Clock, Users, Waves } from 'lucide-react';
import Header from '@/components/Header';
import Footer, { MapSection } from '@/components/Footer';
import Container from '@/components/Container';
import CTASection from '@/components/CTASection';
import CertificationBadges from '@/components/CertificationBadges';

export const metadata = {
  title: 'Sobre nós',
  description:
    'Conheça a Nautitour Passeios — empresa de passeios de escuna e lancha privativa em Armação dos Búzios, RJ.',
  alternates: { canonical: '/sobre-nos' },
};

// Redesenho 12/ago: página rica (hero + seções + equipe + selos) mantendo o
// COPY anterior verbatim — sem inventar fatos, números ou nomes. Quando o
// dono mandar a história real (ano, fundador, equipe), é só encaixar aqui.

const DIFFERENTIALS = [
  { Icon: ShieldCheck, text: 'Embarcações em conformidade com as normas da Marinha do Brasil' },
  { Icon: LifeBuoy, text: 'Coletes salva-vidas para todos os passageiros' },
  { Icon: Wine, text: 'Bar a bordo com drinks tropicais (opcional)' },
  { Icon: Map, text: 'Roteiros que privilegiam paradas para banho nas ilhas mais bonitas' },
  { Icon: CreditCard, text: 'Reserva 100% online, com Pix ou cartão de crédito' },
];

const FACTS = [
  { Icon: Waves, label: '12 praias e 3 ilhas', sub: 'no roteiro da escuna' },
  { Icon: Users, label: 'Até 120 pessoas', sub: 'por saída da escuna' },
  { Icon: Clock, label: '2h30 de passeio', sub: 'com 3 paradas pra mergulho' },
  { Icon: Anchor, label: 'Rua das Pedras', sub: 'embarque no coração de Búzios' },
];

export default function SobreNosPage() {
  return (
    <>
      <Header />
      <main className="bg-white">
        {/* === HERO === */}
        <section className="relative w-full overflow-hidden">
          <Image
            src="/images/photos/escuna/escuna-pier-01.jpg"
            alt="Escuna da Nautitour no píer de Búzios"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, rgba(31,31,31,0.82) 0%, rgba(31,31,31,0.5) 55%, rgba(31,31,31,0.2) 100%)',
            }}
          />
          <Container className="relative py-16 sm:py-20 md:py-24">
            <span className="inline-block text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-300)] mb-4">
              Quem somos
            </span>
            <h1
              className="font-display text-white font-semibold tracking-tight max-w-3xl"
              style={{
                fontSize: 'clamp(1.875rem, 6vw, 4rem)',
                lineHeight: '1.08',
                letterSpacing: '-0.02em',
              }}
            >
              Sobre a Nautitour
            </h1>
            <p className="text-white/85 text-sm sm:text-base md:text-lg leading-relaxed mt-4 max-w-2xl">
              Passeios de escuna e lancha privativa em Armação dos Búzios — RJ.
              Tripulação experiente, embarcações cuidadas, foco em segurança e em
              uma experiência inesquecível pra família e amigos.
            </p>
          </Container>
        </section>

        {/* === Fatos rápidos === */}
        <section className="py-10 sm:py-12 border-b border-[var(--color-charcoal-100)]">
          <Container>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {FACTS.map((fact) => (
                <div key={fact.label} className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-11 h-11 rounded-full bg-[var(--color-red-50)] text-[var(--color-red-600)] shrink-0">
                    <fact.Icon size={20} />
                  </span>
                  <div>
                    <p className="font-sans text-sm sm:text-base font-bold text-[var(--color-charcoal-900)] leading-tight">
                      {fact.label}
                    </p>
                    <p className="text-[11px] sm:text-xs text-[var(--color-charcoal-500)] mt-0.5">
                      {fact.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* === Nossa história === */}
        <section className="py-14 sm:py-16 md:py-20">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
              <div>
                <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)]">
                  Nossa história
                </span>
                <h2
                  className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mt-2 mb-4"
                  style={{ fontSize: 'clamp(1.5rem, 4.5vw, 2.5rem)', lineHeight: '1.12' }}
                >
                  Nascemos em Búzios, da paixão pelo mar.
                </h2>
                <p className="text-sm sm:text-base text-[var(--color-charcoal-600)] leading-relaxed">
                  Nascemos em Búzios da paixão pelo mar e pelas ilhas da região. Há
                  anos recebemos brasileiros e turistas do mundo todo a bordo dos
                  nossos passeios — sempre com atendimento próximo, embarcações
                  cuidadas e o compromisso de fazer cada saída valer o dia inteiro.
                </p>
              </div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                <Image
                  src="/images/photos/escuna/mastros-pier-01.jpg"
                  alt="Mastros da escuna Nautitour no píer"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </Container>
        </section>

        {/* === Nossa equipe === */}
        <section className="py-14 sm:py-16 md:py-20 bg-[var(--color-charcoal-50)]">
          <Container>
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)]">
                Nossa equipe
              </span>
              <h2
                className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mt-2 mb-4"
                style={{ fontSize: 'clamp(1.5rem, 4.5vw, 2.5rem)', lineHeight: '1.12' }}
              >
                Gente do mar, treinada pra cuidar de você.
              </h2>
              <p className="text-sm sm:text-base text-[var(--color-charcoal-600)] leading-relaxed">
                Capitães credenciados, marinheiros experientes e equipe de
                atendimento em português e espanhol. Treinamento contínuo em
                segurança e primeiros socorros faz parte da nossa rotina.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
              <figure className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                <Image
                  src="/images/photos/equipe/bar-equipe-01.jpg"
                  alt="Equipe Nautitour no bar a bordo da escuna"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </figure>
              <figure className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                <Image
                  src="/images/photos/equipe/atendimento-loja-01.jpg"
                  alt="Atendimento na loja da Nautitour em Búzios"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </figure>
            </div>
          </Container>
        </section>

        {/* === O que nos diferencia === */}
        <section className="py-14 sm:py-16 md:py-20">
          <Container>
            <div className="max-w-2xl mb-10 sm:mb-12">
              <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)]">
                O que nos diferencia
              </span>
              <h2
                className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mt-2"
                style={{ fontSize: 'clamp(1.5rem, 4.5vw, 2.5rem)', lineHeight: '1.12' }}
              >
                Detalhes que fazem o passeio valer.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {DIFFERENTIALS.map((item) => (
                <div
                  key={item.text}
                  className="flex items-start gap-3.5 rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-5"
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-red-50)] text-[var(--color-red-600)] shrink-0">
                    <item.Icon size={18} />
                  </span>
                  <p className="text-sm text-[var(--color-charcoal-700)] leading-relaxed pt-1.5">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--color-charcoal-100)] mt-12 pt-10">
              <p className="text-center text-[var(--color-charcoal-700)] text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] mb-8">
                Certificados pelos principais órgãos reguladores
              </p>
              <CertificationBadges />
            </div>
          </Container>
        </section>

        {/* === Onde nos encontrar === */}
        <section className="py-14 sm:py-16 md:py-20 bg-[var(--color-charcoal-50)]">
          <Container>
            <div className="max-w-2xl">
              <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)]">
                Onde nos encontrar
              </span>
              <h2
                className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mt-2 mb-4"
                style={{ fontSize: 'clamp(1.5rem, 4.5vw, 2.5rem)', lineHeight: '1.12' }}
              >
                Embarque no coração de Búzios.
              </h2>
              <p className="text-sm sm:text-base text-[var(--color-charcoal-600)] leading-relaxed">
                <strong>Píer da Rua das Pedras</strong> (embarque padrão sem taxa
                adicional), Armação dos Búzios — RJ. Saídas alternativas no Porto
                Veleiro e Píer do Pescador, sob consulta. Consulte a página de{' '}
                <a
                  href="/contato"
                  className="text-[var(--color-red-600)] underline-offset-2 hover:underline"
                >
                  contato
                </a>{' '}
                para nossos canais diretos.
              </p>
            </div>
          </Container>
        </section>
        <MapSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
