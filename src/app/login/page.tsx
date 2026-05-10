import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
      <main className="bg-white">
        <section className="px-[60px] py-16 max-w-md mx-auto">
          <h1 className="text-[36px] font-normal mb-8 text-center" style={{ color: 'rgb(219, 56, 44)' }}>
            Entrar
          </h1>
          <LoginForm redirectTo={redirect} />
        </section>
      </main>
      <Footer />
    </>
  );
}
