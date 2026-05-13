import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Container from '@/components/Container';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  return (
    <>
      <Header />
      <main className="bg-[var(--color-charcoal-50)]">
        <Container as="section" className="py-12 sm:py-16 md:py-20 max-w-md">
          <div className="text-center mb-8">
            <span className="block text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)] mb-3">
              Sua conta
            </span>
            <h1
              className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight"
              style={{
                fontSize: 'clamp(1.875rem, 5vw, 2.75rem)',
                lineHeight: '1.1',
                letterSpacing: '-0.02em',
              }}
            >
              Entrar
            </h1>
          </div>
          <LoginForm redirectTo={redirect} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
