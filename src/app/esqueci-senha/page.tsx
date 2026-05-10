import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ForgotPasswordForm from './ForgotPasswordForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Esqueci minha senha | Nautitour Passeios',
};

export default function EsqueciSenhaPage() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="px-[60px] py-16 max-w-md mx-auto">
          <h1 className="text-[36px] font-normal mb-2 text-center" style={{ color: 'rgb(219, 56, 44)' }}>
            Esqueci minha senha
          </h1>
          <p className="text-sm text-gray-600 mb-8 text-center">
            Informe seu e-mail e vamos te enviar um link para redefinir a senha.
          </p>
          <ForgotPasswordForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
