'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingCart, Mail, Phone } from 'lucide-react';
import Wordmark from './Wordmark';

type Props = {
  user: { email: string | null; name: string | null } | null;
  isAdmin?: boolean;
};

const phoneNumbers = [
  { number: '(22) 99773-4466' },
  { number: '(22) 99996-3664' },
  { number: '(22) 98805-2238' },
  { number: '(22) 99908-7800' },
];

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/sobre-nos', label: 'Sobre' },
  { href: '/passeio-escuna', label: 'Passeio de Escuna' },
  { href: '/passeio-lancha', label: 'Passeio de Lancha' },
  { href: '/locacao-escuna', label: 'Locação Privativa' },
];

export default function HeaderClient({ user, isAdmin = false }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const displayName = user?.name?.split(' ')[0] ?? user?.email ?? null;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top contact bar — red-600 */}
      <div className="hidden md:flex bg-[var(--color-red-600)] text-white text-xs px-12 py-2 items-center justify-between">
        <a
          href="mailto:passeiodeescuna.tx@gmail.com"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Mail size={14} />
          passeiodeescuna.tx@gmail.com
        </a>
        <div className="flex items-center gap-4">
          {phoneNumbers.map((p, i) => (
            <a
              key={i}
              href={`tel:${p.number.replace(/\D/g, '')}`}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              {i === 0 && <Phone size={14} />}
              {p.number}
            </a>
          ))}
        </div>
      </div>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center justify-between h-20 px-12 border-b border-[var(--color-charcoal-100)]">
        <Wordmark size="lg" showTagline />

        <div className="flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-colors ${
                  isActive
                    ? 'text-[var(--color-red-600)]'
                    : 'text-[var(--color-charcoal-700)] hover:text-[var(--color-red-600)]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-5">
          {displayName ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin/reservas"
                  className="text-sm font-bold text-[var(--color-red-600)] hover:opacity-80 transition-opacity"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/minhas-reservas"
                className="text-sm font-semibold text-[var(--color-charcoal-700)] hover:text-[var(--color-red-600)] transition-colors"
              >
                Minhas reservas
              </Link>
              <Link
                href="/minha-conta"
                className="text-sm font-semibold text-[var(--color-charcoal-700)] hover:text-[var(--color-red-600)] transition-colors"
              >
                Olá, {displayName}
              </Link>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm font-semibold text-[var(--color-charcoal-500)] hover:text-[var(--color-charcoal-900)] transition-colors"
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-[var(--color-charcoal-700)] hover:text-[var(--color-red-600)] transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/signup"
                className="text-sm font-bold text-white bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] px-5 py-2 rounded-full transition-colors"
              >
                Cadastre-se
              </Link>
            </>
          )}
          <button
            aria-label="Carrinho"
            className="text-[var(--color-charcoal-700)] hover:text-[var(--color-red-600)] transition-colors"
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center justify-between h-16 px-5 border-b border-[var(--color-charcoal-100)]">
        <Wordmark size="md" />
        <div className="flex items-center gap-3">
          <button
            aria-label="Carrinho"
            className="text-[var(--color-charcoal-700)] p-2"
          >
            <ShoppingCart size={20} />
          </button>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
            className="text-[var(--color-charcoal-700)] p-2"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-[var(--color-charcoal-100)] px-5 py-4">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-sm font-semibold py-1 ${
                    isActive
                      ? 'text-[var(--color-red-600)]'
                      : 'text-[var(--color-charcoal-700)]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <hr className="border-[var(--color-charcoal-100)] my-2" />
            {displayName ? (
              <>
                <span className="text-sm font-semibold text-[var(--color-charcoal-700)]">
                  Olá, {displayName}
                </span>
                {isAdmin && (
                  <Link
                    href="/admin/reservas"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-sm font-bold text-[var(--color-red-600)]"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/minhas-reservas"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm font-semibold text-[var(--color-charcoal-700)]"
                >
                  Minhas reservas
                </Link>
                <Link
                  href="/minha-conta"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm font-semibold text-[var(--color-charcoal-700)]"
                >
                  Minha conta
                </Link>
                <form action="/api/auth/signout" method="post">
                  <button
                    type="submit"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-sm font-semibold text-[var(--color-charcoal-500)]"
                  >
                    Sair
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm font-semibold text-[var(--color-charcoal-700)]"
                >
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm font-bold text-white bg-[var(--color-red-600)] py-2 px-4 rounded-full text-center"
                >
                  Cadastre-se
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
