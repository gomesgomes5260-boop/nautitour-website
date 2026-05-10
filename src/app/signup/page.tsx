import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SignupForm from './SignupForm';

export const dynamic = 'force-dynamic';

export default function SignupPage() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="px-[60px] py-16 max-w-md mx-auto">
          <h1 className="text-[36px] font-normal mb-2 text-center" style={{ color: 'rgb(219, 56, 44)' }}>
            Criar conta
          </h1>
          <p className="text-sm text-gray-600 mb-8 text-center">
            Cadastre-se para acompanhar suas reservas e ganhar acesso a benefícios.
          </p>
          <SignupForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
