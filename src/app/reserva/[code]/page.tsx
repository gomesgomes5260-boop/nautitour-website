import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createAdminClient } from '@/lib/supabase/admin';
import HoldCountdown from './HoldCountdown';

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

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  const visible = user.slice(0, 1);
  return `${visible}${'*'.repeat(Math.max(1, user.length - 1))}@${domain}`;
}

export default async function ReservaPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const admin = createAdminClient();

  // Service-role read; PostgREST never exposes this to anon callers.
  const { data: booking } = await admin
    .from('bookings')
    .select(
      `
      booking_code,
      status,
      passenger_count,
      total_cents,
      currency,
      created_at,
      expires_at,
      tour:tours ( name, slug ),
      schedule:tour_schedules ( departure_at ),
      customer:customers ( email, full_name )
    `
    )
    .eq('booking_code', code)
    .maybeSingle();

  if (!booking) notFound();

  type Joined = {
    booking_code: string;
    status: string;
    passenger_count: number;
    total_cents: number;
    currency: string;
    created_at: string;
    expires_at: string | null;
    tour: { name: string; slug: string } | { name: string; slug: string }[] | null;
    schedule: { departure_at: string } | { departure_at: string }[] | null;
    customer: { email: string; full_name: string | null } | { email: string; full_name: string | null }[] | null;
  };
  const b = booking as unknown as Joined;
  const tour = Array.isArray(b.tour) ? b.tour[0] : b.tour;
  const schedule = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
  const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;

  const status = STATUS_LABEL[b.status] ?? { label: b.status, tone: 'blue' as const };

  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="px-[60px] py-12 max-w-3xl mx-auto">
          <p className="text-sm text-gray-500 mb-2">Reserva</p>
          <h1 className="text-[36px] font-normal mb-1" style={{ color: 'rgb(219, 56, 44)' }}>
            {b.booking_code}
          </h1>
          <p className="text-gray-600 mb-8">{tour?.name}</p>

          <div className={`border rounded-md p-4 mb-8 ${TONE_CLASSES[status.tone]}`}>
            <p className="font-semibold">{status.label}</p>
            {b.status === 'pending_payment' && (
              <>
                <p className="text-sm mt-1">
                  Sua reserva está garantida pelos próximos minutos. Conclua o pagamento para
                  confirmá-la.
                </p>
                {b.expires_at && <HoldCountdown expiresAt={b.expires_at} />}
              </>
            )}
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
            {schedule?.departure_at && (
              <Item label="Saída">
                <span className="capitalize">
                  {DATE_FORMATTER.format(new Date(schedule.departure_at))}
                </span>
              </Item>
            )}
            <Item label="Passageiros">{b.passenger_count}</Item>
            <Item label="Total">
              {PRICE_FORMATTER.format(b.total_cents / 100)}
            </Item>
            {customer?.full_name && <Item label="Cliente">{customer.full_name}</Item>}
            {customer?.email && <Item label="E-mail">{maskEmail(customer.email)}</Item>}
          </dl>

          {b.status === 'pending_payment' && (
            <Link
              href={`/reserva/${b.booking_code}/pagamento`}
              className="block w-full px-6 py-4 text-center text-white text-base font-semibold rounded-full"
              style={{ backgroundColor: 'rgb(9, 110, 171)' }}
            >
              Ir para pagamento
            </Link>
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
