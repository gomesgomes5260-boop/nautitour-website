import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Container from '@/components/Container';
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
      <main className="bg-[var(--color-charcoal-50)]">
        <Container as="section" className="py-10 sm:py-14 md:py-16 max-w-2xl">
          <Link
            href={`/reserva/${code}`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-charcoal-500)] hover:text-[var(--color-red-600)] transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            Voltar para os detalhes
          </Link>

          <span className="block text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)] mb-3">
            Pagamento · Código
          </span>
          <h1
            className="font-mono text-[var(--color-charcoal-900)] font-bold tracking-tight mb-2"
            style={{
              fontSize: 'clamp(1.875rem, 5vw, 2.75rem)',
              lineHeight: '1.05',
            }}
          >
            {b.booking_code}
          </h1>
          <p className="text-[var(--color-charcoal-500)] mb-2">{tour?.name}</p>
          <p className="inline-flex items-center gap-1.5 text-xs text-[var(--color-charcoal-500)] mb-8">
            <Lock size={12} />
            Pagamento processado pela Pagar.me — dados criptografados.
          </p>

          {!allowed ? (
            <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-8">
              <p className="font-display text-lg font-semibold text-[var(--color-charcoal-900)] mb-2">
                Pagamento online em breve
              </p>
              <p className="text-sm text-[var(--color-charcoal-700)]">
                {mode === 'off'
                  ? 'Estamos finalizando a integração com o gateway de pagamento. Por enquanto, finalize a sua reserva pelo WhatsApp informando o código '
                  : 'Pagamento online ainda não liberado para este perfil. Finalize pelo WhatsApp informando o código '}
                <strong className="text-[var(--color-charcoal-900)]">{b.booking_code}</strong>.
              </p>
              <a
                href={`https://wa.me/5522998479728?text=${encodeURIComponent(
                  `Olá! Quero finalizar a reserva ${b.booking_code}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-5 px-6 py-3 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-semibold rounded-full transition-colors"
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
        </Container>
      </main>
      <Footer />
    </>
  );
}
