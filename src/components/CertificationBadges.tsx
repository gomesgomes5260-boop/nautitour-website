import fs from 'node:fs';
import path from 'node:path';
import Image from 'next/image';
import { ShieldCheck, BadgeCheck, Anchor, Landmark, Award } from 'lucide-react';

// Faixa de selos de certificação — extraída do WhyChooseUs pra reuso na
// página Sobre. Logos ficam em public/images/logos/certifications; sem o
// arquivo, cai no ícone lucide.

const CERT_LOGO_DIR = path.join(process.cwd(), 'public/images/logos/certifications');

function hasLogo(filename: string): boolean {
  try {
    return fs.existsSync(path.join(CERT_LOGO_DIR, filename));
  } catch {
    return false;
  }
}

export default function CertificationBadges() {
  const cadasturLogo = hasLogo('cadastur.png') ? '/images/logos/certifications/cadastur.png' : null;
  const marinhaLogo = hasLogo('marinha.png') ? '/images/logos/certifications/marinha.png' : null;
  const prefeituraLogo = hasLogo('prefeitura-buzios.png')
    ? '/images/logos/certifications/prefeitura-buzios.png'
    : null;
  const turistaSeguroLogo = hasLogo('turista-seguro.png')
    ? '/images/logos/certifications/turista-seguro.png'
    : null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-10">
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
      <CertBadge
        logoSrc={turistaSeguroLogo}
        logoAlt="Logo do programa Turista Seguro"
        FallbackIcon={Award}
        label="Turista Seguro"
        sublabel="Selo de proteção ao turista"
      />
    </div>
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
