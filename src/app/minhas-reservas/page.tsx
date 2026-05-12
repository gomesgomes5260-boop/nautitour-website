import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import CancelBookingButton from '@/app/reserva/[code]/CancelBookingButton';

export const dynamic = 'force-dynamic';

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const STATUS_LABEL: Record<
  string,
  { label: string; tone: 'amber' | 'green' | 'red' | 'blue' | 'gray' }
> = {
  pending_payment: { label: 'Aguardando pagamento', tone: 'amber' },
  confirmed: { label: 'Confirmada', tone: 'green' },
  completed: { label: 'Concluída', tone: 'gray' },
  cancelled: { label: 'Cancelada', tone: 'red' },
  refunded: { label: 'Reembolsada', tone: 'blue' },
};

const TONE_CLASSES: Record<'amber' | 'green' | 'red' | 'blue' | 'gray', string> = {
  amber: 'bg-amber-50 text-amber-800',
  green: 'bg-green-50 text-green-800',
  red: 'bg-red-50 text-red-800',
  blue: 'bg-blue-50 text-blue-800',
  gray: 'bg-gray-100 text-gray-700',
};

export default async function MinhasReservasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/minhas-reservas');
  }

  // RLS restricts to bookings whose customer_id matches this auth user
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(
      'id, booking_code, status, passenger_count, total_cents, currency, created_at, tours(name, slug), tour_schedules(departure_at)'
    )
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Para cada booking, determinar se cliente pode cancelar inline (48h cutoff)
  // e se há payment pago (pra aviso no modal).
  function canCancelClientSide(
    status: string,
    departureAt: string | null | undefined
  ): boolean {
    if (status !== 'confirmed' && status !== 'pending_payment') return false;
    if (!departureAt) return false;
    const hoursUntil = (new Date(departureAt).getTime() - Date.now()) / 3600000;
    return hoursUntil >= 48;
  }

  // Bulk-fetch payment status (paid) pra avisar do refund manual
  const cancellableIds = (bookings ?? [])
    .filter((b) => {
      const sched = Array.isArray(b.tour_schedules) ? b.tour_schedules[0] : b.tour_schedules;
      return canCancelClientSide(b.status, sched?.departure_at ?? null);
    })
    .map((b) => b.id);
  let paidByBookingId = new Set<string>();
  if (cancellableIds.length > 0) {
    const { data: paidPayments } = await supabase
      .from('payments')
      .select('booking_id')
      .in('booking_id', cancellableIds)
      .eq('status', 'paid');
    paidByBookingId = new Set((paidPayments ?? []).map((p) => p.booking_id));
  }

  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="px-[60px] py-12 max-w-4xl mx-auto">
          <h1 className="text-[36px] font-normal mb-2" style={{ color: 'rgb(219, 56, 44)' }}>
            Minhas reservas
          </h1>
          <p className="text-sm text-gray-600 mb-8">
            Acompanhe o status, datas e valores das suas reservas.
          </p>

          {!bookings || bookings.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-700 mb-4">
                Você ainda não tem reservas.
              </p>
              <Link
                href="/passeio-escuna"
                className="inline-block px-6 py-3 text-white text-sm font-semibold rounded-full"
                style={{ backgroundColor: 'rgb(9, 110, 171)' }}
              >
                Ver passeios
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {bookings.map((b) => {
                const tour = Array.isArray(b.tours) ? b.tours[0] : b.tours;
                const schedule = Array.isArray(b.tour_schedules)
                  ? b.tour_schedules[0]
                  : b.tour_schedules;
                const status = STATUS_LABEL[b.status] ?? { label: b.status, tone: 'gray' as const };

                return (
                  <li
                    key={b.id}
                    className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-mono text-sm text-gray-500">{b.booking_code}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${TONE_CLASSES[status.tone]}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="font-medium text-gray-800">{tour?.name ?? '—'}</p>
                      {schedule?.departure_at && (
                        <p className="text-sm text-gray-600 capitalize">
                          {DATE_FORMATTER.format(new Date(schedule.departure_at))}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {b.passenger_count}{' '}
                        {b.passenger_count === 1 ? 'passageiro' : 'passageiros'} •{' '}
                        {PRICE_FORMATTER.format(b.total_cents / 100)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {canCancelClientSide(b.status, schedule?.departure_at ?? null) && (
                        <CancelBookingButton
                          bookingCode={b.booking_code}
                          variant="inline"
                          hasPaidPayment={paidByBookingId.has(b.id)}
                        />
                      )}
                      <Link
                        href={`/reserva/${b.booking_code}`}
                        className="px-4 py-2 text-sm font-medium rounded-full border"
                        style={{ color: 'rgb(9, 110, 171)', borderColor: 'rgb(9, 110, 171)' }}
                      >
                        Ver detalhes
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
