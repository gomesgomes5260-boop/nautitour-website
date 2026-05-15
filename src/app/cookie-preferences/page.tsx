import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Container from '@/components/Container';
import CookiePreferencesForm from './CookiePreferencesForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Preferências de cookies',
  description:
    'Gerencie suas preferências de cookies analíticos e de marketing no site Nautitour.',
  alternates: { canonical: '/cookie-preferences' },
  robots: { index: false, follow: true },
};

export default function CookiePreferencesPage() {
  return (
    <>
      <Header />
      <main className="bg-[var(--color-charcoal-50)]">
        <Container as="section" className="py-12 sm:py-16 md:py-20 max-w-2xl">
          <div className="text-center mb-8">
            <span className="block text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)] mb-3">
              Privacidade
            </span>
            <h1
              className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mb-3"
              style={{
                fontSize: 'clamp(1.875rem, 5vw, 2.75rem)',
                lineHeight: '1.1',
                letterSpacing: '-0.02em',
              }}
            >
              Preferências de cookies
            </h1>
            <p className="text-sm text-[var(--color-charcoal-500)]">
              Você pode aceitar ou revogar consentimento a qualquer momento.
              Mudanças entram em efeito imediatamente.
            </p>
          </div>
          <CookiePreferencesForm />
        </Container>
      </main>
      <Footer />
    </>
  );
}
