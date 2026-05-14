import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, AlertTriangle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Container from '@/components/Container';
import { createAdminClient } from '@/lib/supabase/admin';
import CheckoutForm from './CheckoutForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Finalizar reserva',
  description: 'Confirmação dos dados para sua reserva Nautitour.',
  robots: { index: false, follow: false },
};

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ scheduleId: string }>;
}) {
  const { scheduleId } = await params;
  // Service-role read: bypasses the public tours_read RLS so the
  // tour-de-teste (is_test_only=true) is reachable via direct link
  // during E2E validation. Anyone who guesses a schedule UUID gets the
  // checkout form; the booking RPC still rejects sold-out / cancelled.
  const admin = createAdminClient();

  const { data: schedule, error: scheduleError } = await admin
    .from('tour_schedules')
    .select('id, departure_at, capacity, seats_taken, price_cents, status, tour:tours(*), pier:embarkation_piers(slug, name, fee_cents, address, notes)')
    .eq('id', scheduleId)
    .maybeSingle();

  if (scheduleError) throw scheduleError;
  if (!schedule || !schedule.tour) notFound();

  const tour = Array.isArray(schedule.tour) ? schedule.tour[0] : schedule.tour;
  const pierRaw = (schedule as { pier?: unknown }).pier;
  const pier = Array.isArray(pierRaw) ? pierRaw[0] : pierRaw;
  const pierTyped = pier as
    | { slug: string; name: string; fee_cents: number; address: string | null; notes: string | null }
    | null
    | undefined;
  const isPrivate = tour.tour_type === 'private';
  const pricingMode: 'per_passenger' | 'per_slot' = isPrivate
    ? 'per_slot'
    : 'per_passenger';
  const seatsLeft = schedule.capacity - schedule.seats_taken;
  const isSoldOut = schedule.status === 'sold_out' || seatsLeft <= 0;
  const isCancelled = schedule.status === 'cancelled';
  const unitPriceCents = schedule.price_cents ?? tour.base_price_cents;

  return (
    <>
      <Header />
      <main className="bg-[var(--color-charcoal-50)]">
        <Container as="section" className="py-10 sm:py-14 md:py-16 max-w-4xl">
          <Link
            href={`/${tour.slug === 'lancha-privativa' ? 'passeio-lancha' : 'passeio-escuna'}`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-charcoal-500)] hover:text-[var(--color-red-600)] transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            Voltar
          </Link>

          <span className="block text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)] mb-3">
            Finalizar reserva
          </span>
          <h1
            className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mb-6"
            style={{
              fontSize: 'clamp(1.875rem, 5vw, 3rem)',
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
            }}
          >
            Quase lá. Vamos só checar quem embarca.
          </h1>

          <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-7 mb-6">
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--color-charcoal-500)] mb-2">
              {tour.name}
            </p>
            <p className="font-display text-xl sm:text-2xl font-semibold text-[var(--color-charcoal-900)] capitalize leading-tight">
              {DATE_FORMATTER.format(new Date(schedule.departure_at))}
            </p>
            <p className="text-sm text-[var(--color-charcoal-500)] mt-2">
              {isPrivate
                ? `Lancha privativa — até ${schedule.capacity} pessoas`
                : `${seatsLeft} ${seatsLeft === 1 ? 'vaga disponível' : 'vagas disponíveis'}`}
            </p>
          </div>

          {pierTyped && (
            <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-7 mb-8">
              <div className="flex items-start gap-3">
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
                    pierTyped.fee_cents > 0
                      ? 'bg-[var(--color-red-50)] text-[var(--color-red-600)]'
                      : 'bg-[var(--color-charcoal-50)] text-[var(--color-charcoal-700)]'
                  }`}
                >
                  <MapPin size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--color-charcoal-500)] mb-1">
                    Local de embarque
                  </p>
                  <p className="text-base font-semibold text-[var(--color-charcoal-900)]">
                    {pierTyped.name}
                  </p>
                  {pierTyped.address && (
                    <p className="text-sm text-[var(--color-charcoal-500)] mt-0.5">
                      {pierTyped.address}
                    </p>
                  )}
                  {pierTyped.fee_cents > 0 ? (
                    <p className="mt-3 text-sm text-[var(--color-charcoal-700)] leading-relaxed">
                      <strong className="text-[var(--color-red-600)]">
                        Taxa de embarque R$ {(pierTyped.fee_cents / 100).toFixed(2).replace('.', ',')} por pessoa
                      </strong>{' '}
                      paga presencialmente na loja no dia do passeio (não é cobrada no site).
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--color-charcoal-500)]">
                      Sem taxa de embarque adicional.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isCancelled ? (
            <NoticeBox tone="danger">Esta saída foi cancelada.</NoticeBox>
          ) : isSoldOut ? (
            <NoticeBox tone="warning">
              Esta saída está esgotada. Escolha outra data.
            </NoticeBox>
          ) : unitPriceCents == null ? (
            <NoticeBox tone="warning">
              Esta saída não tem preço configurado. Entre em contato pelo WhatsApp.
            </NoticeBox>
          ) : (
            <CheckoutForm
              scheduleId={schedule.id}
              unitPriceCents={unitPriceCents}
              pricingMode={pricingMode}
              maxPassengers={schedule.capacity}
            />
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}

function NoticeBox({
  tone,
  children,
}: {
  tone: 'danger' | 'warning';
  children: React.ReactNode;
}) {
  const styles =
    tone === 'danger'
      ? 'bg-[var(--color-red-50)] border-[var(--color-red-100)] text-[var(--color-red-900)]'
      : 'bg-[var(--color-charcoal-50)] border-[var(--color-charcoal-100)] text-[var(--color-charcoal-900)]';
  return (
    <div className={`rounded-2xl border p-5 flex items-start gap-3 ${styles}`}>
      <AlertTriangle size={20} className="shrink-0 mt-0.5" />
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}
