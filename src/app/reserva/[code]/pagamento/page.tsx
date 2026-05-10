import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import { canPay, getMode } from '@/lib/pagarme/config';
import PaymentMethodPicker from './PaymentMethodPicker';

export const dynamic = 'force-dynamic';

export default async function PagamentoPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: booking, error } = await supabase.rpc('get_booking_by_code', {
    p_code: code,
  });
  if (error) throw error;
  const row = booking?.[0];
  if (!row) notFound();

  if (row.status !== 'pending_payment') {
    redirect(`/reserva/${code}`);
  }

  const mode = getMode();
  const allowed = canPay(row.customer_email);

  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="px-[60px] py-12 max-w-2xl mx-auto">
          <p className="text-sm text-gray-500 mb-2">Pagamento da reserva</p>
          <h1 className="text-[36px] font-normal mb-1" style={{ color: 'rgb(219, 56, 44)' }}>
            {row.booking_code}
          </h1>
          <p className="text-gray-600 mb-8">{row.tour_name}</p>

          {!allowed ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-6">
              <p className="font-semibold mb-2">Pagamento online em breve</p>
              <p className="text-sm">
                {mode === 'off'
                  ? 'Estamos finalizando a integração com o gateway de pagamento. Por enquanto, finalize a sua reserva pelo WhatsApp informando o código '
                  : 'Pagamento online ainda não liberado para este perfil. Finalize pelo WhatsApp informando o código '}
                <strong>{row.booking_code}</strong>.
              </p>
              <a
                href={`https://wa.me/5522998479728?text=${encodeURIComponent(
                  `Olá! Quero finalizar a reserva ${row.booking_code}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 px-6 py-3 text-white text-sm font-semibold rounded-full"
                style={{ backgroundColor: 'rgb(9, 110, 171)' }}
              >
                Falar no WhatsApp
              </a>
            </div>
          ) : (
            <PaymentMethodPicker
              bookingCode={row.booking_code}
              totalCents={row.total_cents}
            />
          )}

          <Link
            href={`/reserva/${code}`}
            className="block text-center mt-6 text-sm text-gray-600 hover:underline"
          >
            ← Voltar para os detalhes da reserva
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
