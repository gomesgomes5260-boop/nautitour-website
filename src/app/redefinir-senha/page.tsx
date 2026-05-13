import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Container from '@/components/Container';
import { createClient } from '@/lib/supabase/server';
import ResetPasswordForm from './ResetPasswordForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Redefinir senha | Nautitour Passeios',
};

export default async function RedefinirSenhaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Reset link expired or accessed without a valid session — back to forgot.
  if (!user) {
    redirect('/esqueci-senha?expired=1');
  }

  return (
    <>
      <Header />
      <main className="bg-[var(--color-charcoal-50)]">
        <Container as="section" className="py-12 sm:py-16 md:py-20 max-w-md">
          <div className="text-center mb-8">
            <span className="block text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)] mb-3">
              Nova senha
            </span>
            <h1
              className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mb-3"
              style={{
                fontSize: 'clamp(1.875rem, 5vw, 2.75rem)',
                lineHeight: '1.1',
                letterSpacing: '-0.02em',
              }}
            >
              Redefinir senha
            </h1>
            <p className="text-sm text-[var(--color-charcoal-500)]">
              Defina uma nova senha para a sua conta.
            </p>
          </div>
          <ResetPasswordForm />
        </Container>
      </main>
      <Footer />
    </>
  );
}
