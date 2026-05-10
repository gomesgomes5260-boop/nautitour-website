import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="px-[60px] py-24 max-w-2xl mx-auto text-center">
          <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">404</p>
          <h1 className="text-[36px] font-normal mb-4" style={{ color: 'rgb(219, 56, 44)' }}>
            Página não encontrada
          </h1>
          <p className="text-gray-700 mb-8">
            O link pode ter expirado ou a página foi movida. Tente voltar para a
            home ou escolher um dos passeios.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/"
              className="px-6 py-3 text-white text-sm font-semibold rounded-full"
              style={{ backgroundColor: 'rgb(9, 110, 171)' }}
            >
              Voltar para a home
            </Link>
            <Link
              href="/passeio-escuna"
              className="px-6 py-3 text-sm font-semibold rounded-full border-2"
              style={{ color: 'rgb(9, 110, 171)', borderColor: 'rgb(9, 110, 171)' }}
            >
              Ver passeios
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
