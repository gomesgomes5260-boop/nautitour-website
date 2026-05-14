import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';
import Logo from './Logo';
import Container from './Container';

export function MapSection() {
  return (
    <section className="w-full bg-white py-14 sm:py-16 md:py-24">
      <Container>
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)]">
            Visite nossa loja
          </span>
          <h3
            className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mt-3"
            style={{ fontSize: 'clamp(1.5rem, 4.5vw, 2.75rem)', lineHeight: '1.1', letterSpacing: '-0.02em' }}
          >
            Onde estamos.
          </h3>
          <p className="text-[var(--color-charcoal-500)] text-sm md:text-base mt-3">
            Travessa dos Pescadores, 326 · Búzios — RJ
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[var(--color-charcoal-100)] shadow-[var(--shadow-1)]">
          <iframe
            src="https://maps.google.com/maps?q=Tv.%20dos%20Pescadores%2C%20326%20-%20Lot.%20Triangulo%20de%20Buzios&t=&z=15&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="380"
            style={{ border: 0, display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa Nautitour Búzios"
          />
        </div>
      </Container>
    </section>
  );
}

export default function Footer() {
  return (
    <footer className="w-full bg-[var(--color-charcoal-900)] text-white">
      <Container as="div" className="py-14 sm:py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-10 md:gap-12 mb-12 sm:mb-14">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Logo size="md" variant="white" />
            <p className="text-white/60 text-sm mt-5 leading-relaxed max-w-xs">
              Passeios de barco em Búzios desde sempre. Segurança certificada, equipe que conhece o mar.
            </p>
          </div>

          <div>
            <h4 className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-white/50 mb-4">
              Institucional
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/" className="text-white/85 text-sm hover:text-[var(--color-red-300)] transition-colors">Home</Link></li>
              <li><Link href="/sobre-nos" className="text-white/85 text-sm hover:text-[var(--color-red-300)] transition-colors">Quem somos</Link></li>
              <li><Link href="/politica-de-privacidade" className="text-white/85 text-sm hover:text-[var(--color-red-300)] transition-colors">Política de Privacidade</Link></li>
              <li><Link href="/politica-de-cancelamento" className="text-white/85 text-sm hover:text-[var(--color-red-300)] transition-colors">Política de Cancelamento</Link></li>
              <li><Link href="/termos-de-uso" className="text-white/85 text-sm hover:text-[var(--color-red-300)] transition-colors">Termos de Uso</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-white/50 mb-4">
              Atendimento
            </h4>
            <ul className="space-y-2.5">
              <li><a href="tel:+5522999963664" className="text-white/85 text-sm hover:text-[var(--color-red-300)] transition-colors">(22) 99996-3664</a></li>
              <li><a href="tel:+5522988052238" className="text-white/85 text-sm hover:text-[var(--color-red-300)] transition-colors">(22) 98805-2238</a></li>
              <li><a href="tel:+5522997734466" className="text-white/85 text-sm hover:text-[var(--color-red-300)] transition-colors">(22) 99773-4466</a></li>
              <li><a href="tel:+5522999087800" className="text-white/85 text-sm hover:text-[var(--color-red-300)] transition-colors">(22) 99908-7800</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-white/50 mb-4">
              Contato
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:passeiodeescuna.tx@gmail.com" className="flex items-start gap-2 text-white/85 text-sm hover:text-[var(--color-red-300)] transition-colors">
                  <Mail size={15} className="mt-0.5 shrink-0" />
                  <span className="break-all">passeiodeescuna.tx@gmail.com</span>
                </a>
              </li>
              <li className="flex items-start gap-2 text-white/85 text-sm">
                <MapPin size={15} className="mt-0.5 shrink-0" />
                <span>Travessa dos Pescadores, 326<br />Búzios — RJ, 28950-000</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/15 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-5">
          <p className="text-white/60 text-xs">
            ©2026 Todos os direitos reservados. Nautitour Passeios.
          </p>
          <div className="flex gap-3">
            <SocialLink href="#" label="Facebook">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </SocialLink>
            <SocialLink href="#" label="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </SocialLink>
            <SocialLink href="#" label="YouTube">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.378.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.12 2.136c1.873.505 9.378.505 9.378.505s7.505 0 9.378-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </SocialLink>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-[var(--color-red-600)] text-white flex items-center justify-center transition-colors"
    >
      {children}
    </a>
  );
}
