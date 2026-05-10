import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const STATUS_LABEL: Record<string, { label: string; tone: 'amber' | 'green' | 'red' | 'blue' }> = {
  pending_payment: { label: 'Aguardando pagamento', tone: 'amber' },
  confirmed: { label: 'Confirmada', tone: 'green' },
  completed: { label: 'Concluída', tone: 'green' },
  cancelled: { label: 'Cancelada', tone: 'red' },
  refunded: { label: 'Reembolsada', tone: 'blue' },
};

const TONE_CLASSES: Record<'amber' | 'green' | 'red' | 'blue', string> = {
  amber: 'bg-amber-50 border-amber-200 text-amber-800',
  green: 'bg-green-50 border-green-200 text-green-800',
  red: 'bg-red-50 border-red-200 text-red-800',
  blue: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default async function ReservaPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_booking_by_code', { p_code: code });
  if (error) throw error;
  const booking = data?.[0];
  if (!booking) notFound();

  const status = STATUS_LABEL[booking.status] ?? { label: booking.status, tone: 'blue' as const };

  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="px-[60px] py-12 max-w-3xl mx-auto">
          <p className="text-sm text-gray-500 mb-2">Reserva</p>
          <h1 className="text-[36px] font-normal mb-1" style={{ color: 'rgb(219, 56, 44)' }}>
            {booking.booking_code}
          </h1>
          <p className="text-gray-600 mb-8">{booking.tour_name}</p>

          <div className={`border rounded-md p-4 mb-8 ${TONE_CLASSES[status.tone]}`}>
            <p className="font-semibold">{status.label}</p>
            {booking.status === 'pending_payment' && (
              <p className="text-sm mt-1">
                Sua reserva está garantida pelos próximos minutos. Conclua o pagamento para
                confirmá-la.
              </p>
            )}
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
            {booking.departure_at && (
              <Item label="Saída">
                <span className="capitalize">
                  {DATE_FORMATTER.format(new Date(booking.departure_at))}
                </span>
              </Item>
            )}
            <Item label="Passageiros">{booking.passenger_count}</Item>
            <Item label="Total">
              {PRICE_FORMATTER.format(booking.total_cents / 100)}
            </Item>
            <Item label="Cliente">{booking.customer_full_name ?? booking.customer_email}</Item>
            <Item label="E-mail">{booking.customer_email}</Item>
          </dl>

          {booking.status === 'pending_payment' && (
            <button
              disabled
              className="w-full px-6 py-4 text-white text-base font-semibold rounded-full opacity-50 cursor-not-allowed"
              style={{ backgroundColor: 'rgb(9, 110, 171)' }}
            >
              Pagamento (Pagar.me) — em breve
            </button>
          )}

          <Link
            href="/"
            className="block text-center mt-6 text-sm text-gray-600 hover:underline"
          >
            Voltar para a home
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500 mb-1">{label}</dt>
      <dd className="text-gray-800">{children}</dd>
    </div>
  );
}
