import fs from 'node:fs';
import path from 'node:path';
import Image from 'next/image';
import { ShieldCheck, Wine, Globe2, BadgeCheck, Anchor, Landmark } from 'lucide-react';
import Container from './Container';

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

const CERT_LOGO_DIR = path.join(process.cwd(), 'public/images/logos/certifications');

function hasLogo(filename: string): boolean {
  try {
    return fs.existsSync(path.join(CERT_LOGO_DIR, filename));
  } catch {
    return false;
  }
}

export default function WhyChooseUs() {
  const cadasturLogo = hasLogo('cadastur.png') ? '/images/logos/certifications/cadastur.png' : null;
  const marinhaLogo = hasLogo('marinha.png') ? '/images/logos/certifications/marinha.png' : null;
  const prefeituraLogo = hasLogo('prefeitura-buzios.png')
    ? '/images/logos/certifications/prefeitura-buzios.png'
    : null;

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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 md:gap-16">
            <CertBadge
              logoSrc={cadasturLogo}
              logoAlt="Logo do Cadastur"
              FallbackIcon={BadgeCheck}
              label="Cadastur"
              sublabel="Cadastro Ministério do Turismo"
            />
            <CertBadge
              logoSrc={marinhaLogo}
              logoAlt="Brasão da Marinha do Brasil"
              FallbackIcon={Anchor}
              label="Marinha do Brasil"
              sublabel="Embarcação habilitada"
            />
            <CertBadge
              logoSrc={prefeituraLogo}
              logoAlt="Brasão da Prefeitura de Armação dos Búzios"
              FallbackIcon={Landmark}
              label="Prefeitura de Búzios"
              sublabel="Registrada no município"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

function CertBadge({
  logoSrc,
  logoAlt,
  FallbackIcon,
  label,
  sublabel,
}: {
  logoSrc: string | null;
  logoAlt: string;
  FallbackIcon: typeof ShieldCheck;
  label: string;
  sublabel: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3 rounded-2xl border border-[var(--color-charcoal-100)] bg-white min-w-[220px]">
      {logoSrc ? (
        <div className="relative w-14 h-14 shrink-0">
          <Image src={logoSrc} alt={logoAlt} fill sizes="56px" className="object-contain" />
        </div>
      ) : (
        <span className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-red-50)] text-[var(--color-red-600)] shrink-0">
          <FallbackIcon size={20} />
        </span>
      )}
      <div>
        <p className="text-sm font-bold text-[var(--color-charcoal-900)] leading-tight">
          {label}
        </p>
        <p className="text-[10px] text-[var(--color-charcoal-500)] mt-0.5 leading-tight">
          {sublabel}
        </p>
      </div>
    </div>
  );
}
