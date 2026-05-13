import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createAdminClient } from '@/lib/supabase/admin';
import CheckoutForm from './CheckoutForm';

export const dynamic = 'force-dynamic';

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
      <main className="bg-white">
        <section className="px-[60px] py-12 max-w-4xl mx-auto">
          <Link
            href={`/${tour.slug === 'lancha-privativa' ? 'passeio-lancha' : 'passeio-escuna'}`}
            className="text-sm text-gray-600 hover:underline mb-4 inline-block"
          >
            ← Voltar
          </Link>
          <h1 className="text-[36px] font-normal mb-2" style={{ color: 'rgb(219, 56, 44)' }}>
            Finalizar reserva
          </h1>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-600 mb-1">{tour.name}</p>
            <p className="text-lg font-semibold capitalize" style={{ color: 'rgb(9, 110, 171)' }}>
              {DATE_FORMATTER.format(new Date(schedule.departure_at))}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {isPrivate
                ? `Lancha privativa — até ${schedule.capacity} pessoas`
                : `${seatsLeft} ${seatsLeft === 1 ? 'vaga disponível' : 'vagas disponíveis'}`}
            </p>
          </div>

          {pierTyped && (
            <div
              className={`rounded-lg p-5 mb-8 border ${
                pierTyped.fee_cents > 0
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600 mb-1">
                Local de embarque
              </p>
              <p className="text-base font-bold text-gray-900">{pierTyped.name}</p>
              {pierTyped.address && (
                <p className="text-sm text-gray-700 mt-0.5">{pierTyped.address}</p>
              )}
              {pierTyped.fee_cents > 0 ? (
                <p className="mt-3 text-sm text-amber-900 leading-relaxed">
                  ⚠️ <strong>Taxa de embarque R$ {(pierTyped.fee_cents / 100).toFixed(2).replace('.', ',')} por pessoa</strong>{' '}
                  paga presencialmente na loja no dia do passeio (não é cobrada no site).
                </p>
              ) : (
                <p className="mt-2 text-sm text-emerald-900">
                  Sem taxa de embarque adicional.
                </p>
              )}
            </div>
          )}

          {isCancelled ? (
            <p className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
              Esta saída foi cancelada.
            </p>
          ) : isSoldOut ? (
            <p className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4">
              Esta saída está esgotada. Escolha outra data.
            </p>
          ) : unitPriceCents == null ? (
            <p className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4">
              Esta saída não tem preço configurado. Entre em contato pelo WhatsApp.
            </p>
          ) : (
            <CheckoutForm
              scheduleId={schedule.id}
              unitPriceCents={unitPriceCents}
              pricingMode={pricingMode}
              maxPassengers={schedule.capacity}
            />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
