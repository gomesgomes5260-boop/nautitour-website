import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createAdminClient } from '@/lib/supabase/admin';
import { canPay, getMode } from '@/lib/pagarme/config';
import PaymentMethodPicker from './PaymentMethodPicker';

export const dynamic = 'force-dynamic';

export default async function PagamentoPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select(
      `
      booking_code,
      status,
      total_cents,
      expires_at,
      tour:tours ( name, tour_type ),
      customer:customers ( email )
    `
    )
    .eq('booking_code', code)
    .maybeSingle();

  if (!booking) notFound();

  type Joined = {
    booking_code: string;
    status: string;
    total_cents: number;
    expires_at: string | null;
    tour: { name: string; tour_type: string } | { name: string; tour_type: string }[] | null;
    customer: { email: string } | { email: string }[] | null;
  };
  const b = booking as unknown as Joined;

  if (b.status !== 'pending_payment') {
    redirect(`/reserva/${code}`);
  }
  if (b.expires_at && new Date(b.expires_at) < new Date()) {
    redirect(`/reserva/${code}?expired=1`);
  }

  const tour = Array.isArray(b.tour) ? b.tour[0] : b.tour;
  const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;

  const mode = getMode();
  const allowed = canPay(customer?.email ?? null);

  // Parcelamento: lancha (private) até 6x sem juros; escuna 1x à vista.
  const maxInstallments = tour?.tour_type === 'private' ? 6 : 1;

  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="px-[60px] py-12 max-w-2xl mx-auto">
          <p className="text-sm text-gray-500 mb-2">Pagamento da reserva</p>
          <h1 className="text-[36px] font-normal mb-1" style={{ color: 'rgb(219, 56, 44)' }}>
            {b.booking_code}
          </h1>
          <p className="text-gray-600 mb-8">{tour?.name}</p>

          {!allowed ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-6">
              <p className="font-semibold mb-2">Pagamento online em breve</p>
              <p className="text-sm">
                {mode === 'off'
                  ? 'Estamos finalizando a integração com o gateway de pagamento. Por enquanto, finalize a sua reserva pelo WhatsApp informando o código '
                  : 'Pagamento online ainda não liberado para este perfil. Finalize pelo WhatsApp informando o código '}
                <strong>{b.booking_code}</strong>.
              </p>
              <a
                href={`https://wa.me/5522998479728?text=${encodeURIComponent(
                  `Olá! Quero finalizar a reserva ${b.booking_code}.`
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
              bookingCode={b.booking_code}
              totalCents={b.total_cents}
              maxInstallments={maxInstallments}
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
