import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
      <main className="bg-white">
        <section className="px-[60px] py-16 max-w-md mx-auto">
          <h1 className="text-[36px] font-normal mb-2 text-center" style={{ color: 'rgb(219, 56, 44)' }}>
            Redefinir senha
          </h1>
          <p className="text-sm text-gray-600 mb-8 text-center">
            Defina uma nova senha para a sua conta.
          </p>
          <ResetPasswordForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
