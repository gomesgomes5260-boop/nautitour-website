'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X, ShoppingCart } from 'lucide-react';

type Props = {
  user: { email: string | null; name: string | null } | null;
  isAdmin?: boolean;
};

const phoneNumbers = [
  { number: '(22) 99773-4466', display: '(22) 99773-4466' },
  { number: '(22) 99996-3664', display: '(22) 99996-3664' },
  { number: '(22) 98805-2238', display: '(22) 98805-2238' },
  { number: '(22) 99908-7800', display: '(22) 99908-7800' },
];

export default function HeaderClient({ user, isAdmin = false }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const displayName = user?.name?.split(' ')[0] ?? user?.email ?? null;

  return (
    <header>
      <div
        style={{ backgroundColor: 'rgb(217, 0, 6)', height: '51px', padding: '15px 75px' }}
        className="flex justify-between items-center"
      >
        <div className="flex items-center gap-4">
          <div style={{ color: 'white', fontSize: '12px', fontWeight: '500' }}>
            <a href="mailto:passeiodeescuna.tx@gmail.com" className="hover:opacity-80">
              passeiodeescuna.tx@gmail.com
            </a>
          </div>
          <div className="flex gap-2" style={{ color: 'white', fontSize: '12px' }}>
            {phoneNumbers.map((phone, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <span className="mx-1">|</span>}
                <a href={`tel:${phone.number.replace(/\D/g, '')}`} className="hover:opacity-80">
                  {phone.display}
                </a>
              </div>
            ))}
          </div>
        </div>
        <div />
      </div>

      <nav
        style={{ borderBottom: '1px solid rgb(234, 238, 243)' }}
        className="bg-white h-24 px-12 flex items-center justify-between hidden md:flex"
      >
        <Link href="/">
          <div style={{ width: '278px', height: '73px', position: 'relative' }}>
            <Image src="/images/logos/logo-fullcolor.png" alt="Nautitour Logo" fill style={{ objectFit: 'contain' }} priority />
          </div>
        </Link>
        <div className="flex gap-8 ml-auto mr-auto">
          <Link href="/" style={{ color: 'rgb(192, 0, 0)', fontSize: '14px', fontWeight: '600' }} className="hover:opacity-80 transition-opacity">Home</Link>
          <Link href="/sobre-nos" style={{ color: 'black', fontSize: '14px', fontWeight: '600' }} className="hover:opacity-80 transition-opacity">Sobre Nós</Link>
          <Link href="/passeio-escuna" style={{ color: 'black', fontSize: '14px', fontWeight: '600' }} className="hover:opacity-80 transition-opacity">Passeio de Barco / Escuna</Link>
          <Link href="/passeio-lancha" style={{ color: 'black', fontSize: '14px', fontWeight: '600' }} className="hover:opacity-80 transition-opacity">Passeio de Lancha</Link>
          <Link href="/locacao-escuna" style={{ color: 'black', fontSize: '14px', fontWeight: '600' }} className="hover:opacity-80 transition-opacity">Locação Privativa</Link>
        </div>
        <div className="flex gap-6 items-center ml-auto">
          {displayName ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin/reservas"
                  style={{ color: 'rgb(192, 0, 0)', fontSize: '14px', fontWeight: '700' }}
                  className="hover:opacity-80 transition-opacity"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/minhas-reservas"
                style={{ color: 'black', fontSize: '14px', fontWeight: '600' }}
                className="hover:opacity-80 transition-opacity"
              >
                Minhas reservas
              </Link>
              <Link
                href="/minha-conta"
                style={{ color: 'black', fontSize: '14px', fontWeight: '600' }}
                className="hover:opacity-80 transition-opacity"
              >
                Olá, {displayName}
              </Link>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  style={{ color: 'black', fontSize: '14px', fontWeight: '600' }}
                  className="hover:opacity-80 transition-opacity"
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color: 'black', fontSize: '14px', fontWeight: '600' }} className="hover:opacity-80 transition-opacity">Entrar</Link>
              <Link href="/signup" style={{ color: 'black', fontSize: '14px', fontWeight: '600' }} className="hover:opacity-80 transition-opacity">Cadastre-se</Link>
            </>
          )}
          <button style={{ color: 'black' }} className="hover:opacity-80 transition-opacity" aria-label="Shopping Cart">
            <ShoppingCart size={20} />
          </button>
        </div>
      </nav>

      <div className="md:hidden bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between h-20">
        <Link href="/">
          <div style={{ width: '140px', height: '40px', position: 'relative' }}>
            <Image src="/images/logos/logo-fullcolor.png" alt="Nautitour Logo" fill style={{ objectFit: 'contain' }} priority />
          </div>
        </Link>
        <div className="flex gap-4 items-center">
          <button style={{ color: 'black' }} className="hover:opacity-80 transition-opacity" aria-label="Shopping Cart">
            <ShoppingCart size={20} />
          </button>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu" className="hover:opacity-80 transition-opacity">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col gap-4">
            <Link href="/" style={{ color: 'rgb(192, 0, 0)', fontSize: '14px', fontWeight: '600' }} onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link href="/sobre-nos" style={{ color: 'black', fontSize: '14px', fontWeight: '600' }} onClick={() => setIsMenuOpen(false)}>Sobre Nós</Link>
            <Link href="/passeio-escuna" style={{ color: 'black', fontSize: '14px', fontWeight: '600' }} onClick={() => setIsMenuOpen(false)}>Passeio de Barco / Escuna</Link>
            <Link href="/passeio-lancha" style={{ color: 'black', fontSize: '14px', fontWeight: '600' }} onClick={() => setIsMenuOpen(false)}>Passeio de Lancha</Link>
            <Link href="/locacao-escuna" style={{ color: 'black', fontSize: '14px', fontWeight: '600' }} onClick={() => setIsMenuOpen(false)}>Locação Privativa</Link>
            <hr className="my-2" />
            {displayName ? (
              <>
                <span style={{ color: 'black', fontSize: '14px', fontWeight: '600' }}>
                  Olá, {displayName}
                </span>
                {isAdmin && (
                  <Link
                    href="/admin/reservas"
                    style={{ color: 'rgb(192, 0, 0)', fontSize: '14px', fontWeight: '700' }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/minhas-reservas"
                  style={{ color: 'black', fontSize: '14px', fontWeight: '600' }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Minhas reservas
                </Link>
                <Link
                  href="/minha-conta"
                  style={{ color: 'black', fontSize: '14px', fontWeight: '600' }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Minha conta
                </Link>
                <form action="/api/auth/signout" method="post">
                  <button
                    type="submit"
                    style={{ color: 'black', fontSize: '14px', fontWeight: '600' }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sair
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" style={{ color: 'black', fontSize: '14px', fontWeight: '600' }} onClick={() => setIsMenuOpen(false)}>Entrar</Link>
                <Link href="/signup" style={{ color: 'black', fontSize: '14px', fontWeight: '600' }} onClick={() => setIsMenuOpen(false)}>Cadastre-se</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
