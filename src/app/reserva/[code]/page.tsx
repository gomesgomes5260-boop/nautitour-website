import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Container from '@/components/Container';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import HoldCountdown from './HoldCountdown';
import CancelBookingButton from './CancelBookingButton';
import PurchaseTracker from './PurchaseTracker';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sua reserva',
  description: 'Detalhes da reserva Nautitour.',
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
  amber: 'bg-[var(--color-charcoal-50)] border-[var(--color-charcoal-200)] text-[var(--color-charcoal-900)]',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  red: 'bg-[var(--color-red-50)] border-[var(--color-red-100)] text-[var(--color-red-900)]',
  blue: 'bg-sky-50 border-sky-200 text-sky-800',
};

const TONE_DOT: Record<'amber' | 'green' | 'red' | 'blue', string> = {
  amber: 'bg-amber-500',
  green: 'bg-emerald-500',
  red: 'bg-[var(--color-red-600)]',
  blue: 'bg-sky-500',
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
      id,
      booking_code,
      status,
      passenger_count,
      total_cents,
      currency,
      created_at,
      expires_at,
      tour:tours ( name, slug ),
      schedule:tour_schedules ( departure_at, pier:embarkation_piers ( slug, name, fee_cents, address, notes ) ),
      customer:customers ( email, full_name, auth_user_id )
    `
    )
    .eq('booking_code', code)
    .maybeSingle();

  if (!booking) notFound();

  type Joined = {
    id: string;
    booking_code: string;
    status: string;
    passenger_count: number;
    total_cents: number;
    currency: string;
    created_at: string;
    expires_at: string | null;
    tour: { name: string; slug: string } | { name: string; slug: string }[] | null;
    schedule:
      | {
          departure_at: string;
          pier:
            | { slug: string; name: string; fee_cents: number; address: string | null; notes: string | null }
            | { slug: string; name: string; fee_cents: number; address: string | null; notes: string | null }[]
            | null;
        }
      | {
          departure_at: string;
          pier:
            | { slug: string; name: string; fee_cents: number; address: string | null; notes: string | null }
            | { slug: string; name: string; fee_cents: number; address: string | null; notes: string | null }[]
            | null;
        }[]
      | null;
    customer:
      | { email: string; full_name: string | null; auth_user_id: string | null }
      | { email: string; full_name: string | null; auth_user_id: string | null }[]
      | null;
  };
  const b = booking as unknown as Joined;
  const tour = Array.isArray(b.tour) ? b.tour[0] : b.tour;
  const schedule = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
  const pier = schedule
    ? Array.isArray(schedule.pier)
      ? schedule.pier[0]
      : schedule.pier
    : null;
  const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;

  const status = STATUS_LABEL[b.status] ?? { label: b.status, tone: 'blue' as const };

  // Cancelar pelo cliente: precisa auth user logado = dono do booking,
  // status confirmed/pending_payment, departure_at > now + 48h.
  const supabaseAuth = await createClient();
  const {
    data: { user: authUser },
  } = await supabaseAuth.auth.getUser();
  const isOwner =
    !!authUser &&
    !!customer?.auth_user_id &&
    customer.auth_user_id === authUser.id;
  const cancellableStatus = b.status === 'confirmed' || b.status === 'pending_payment';
  const departureMs = schedule?.departure_at ? new Date(schedule.departure_at).getTime() : null;
  const hoursUntil = departureMs ? (departureMs - Date.now()) / (1000 * 60 * 60) : null;
  const within48 = hoursUntil !== null && hoursUntil >= 48;
  const canCancel = isOwner && cancellableStatus && within48;

  // Payment paid? (pra avisar do refund manual no modal)
  let hasPaidPayment = false;
  if (canCancel) {
    const { data: paid } = await admin
      .from('payments')
      .select('id')
      .eq('booking_id', b.id)
      .eq('status', 'paid')
      .limit(1)
      .maybeSingle();
    hasPaidPayment = !!paid;
  }

  return (
    <>
      <Header />
      <PurchaseTracker
        bookingCode={b.booking_code}
        valueBRL={b.total_cents / 100}
      />
      <main className="bg-[var(--color-charcoal-50)]">
        <Container as="section" className="py-10 sm:py-14 md:py-16 max-w-3xl">
          <span className="block text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)] mb-3">
            Reserva confirmada · Código
          </span>
          <h1
            className="font-mono text-[var(--color-charcoal-900)] font-bold tracking-tight mb-2"
            style={{
              fontSize: 'clamp(2rem, 6vw, 3.25rem)',
              lineHeight: '1.05',
            }}
          >
            {b.booking_code}
          </h1>
          <p className="text-[var(--color-charcoal-500)] mb-8">{tour?.name}</p>

          <div className={`rounded-2xl border p-5 mb-6 ${TONE_CLASSES[status.tone]}`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${TONE_DOT[status.tone]}`} aria-hidden />
              <p className="font-semibold">{status.label}</p>
            </div>
            {b.status === 'pending_payment' && (
              <>
                <p className="text-sm mt-2">
                  Sua reserva está garantida pelos próximos minutos. Conclua o pagamento para
                  confirmá-la.
                </p>
                {b.expires_at && <HoldCountdown expiresAt={b.expires_at} />}
              </>
            )}
          </div>

          {pier && (
            <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 mb-8">
              <div className="flex items-start gap-3">
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
                    pier.fee_cents > 0
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
                  <p className="font-semibold text-[var(--color-charcoal-900)]">{pier.name}</p>
                  {pier.address && (
                    <p className="text-sm text-[var(--color-charcoal-500)] mt-0.5">
                      {pier.address}
                    </p>
                  )}
                  {pier.fee_cents > 0 ? (
                    <p className="text-sm text-[var(--color-charcoal-700)] mt-3 leading-relaxed">
                      <strong className="text-[var(--color-red-600)]">
                        Taxa de embarque R$ {(pier.fee_cents / 100).toFixed(2).replace('.', ',')} por pessoa
                      </strong>{' '}
                      paga presencialmente na loja no dia do passeio (não foi cobrada no site).
                      Total p/ {b.passenger_count} pax: R$ {((pier.fee_cents * b.passenger_count) / 100).toFixed(2).replace('.', ',')}.
                    </p>
                  ) : (
                    <p className="text-sm text-[var(--color-charcoal-500)] mt-2">
                      Sem taxa de embarque adicional.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-8 mb-8">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {schedule?.departure_at && (
                <Item label="Saída">
                  <span className="capitalize">
                    {DATE_FORMATTER.format(new Date(schedule.departure_at))}
                  </span>
                </Item>
              )}
              <Item label="Passageiros">{b.passenger_count}</Item>
              <Item label="Total">
                <span className="font-sans font-bold text-[var(--color-red-600)]">
                  {PRICE_FORMATTER.format(b.total_cents / 100)}
                </span>
              </Item>
              {customer?.full_name && <Item label="Cliente">{customer.full_name}</Item>}
              {customer?.email && <Item label="E-mail">{maskEmail(customer.email)}</Item>}
            </dl>
          </div>

          {b.status === 'pending_payment' && (
            <Link
              href={`/reserva/${b.booking_code}/pagamento`}
              className="block w-full px-6 py-4 text-center bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-base font-semibold rounded-full transition-colors shadow-[var(--shadow-2)]"
            >
              Ir para pagamento
            </Link>
          )}

          {canCancel && (
            <div className="mt-8 pt-6 border-t border-[var(--color-charcoal-100)] flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-[var(--color-charcoal-500)]">
                Cancelar até 48h antes da saída.{' '}
                {hoursUntil !== null && (
                  <span>
                    Faltam{' '}
                    {hoursUntil > 24
                      ? `${Math.floor(hoursUntil / 24)} dias`
                      : `${Math.floor(hoursUntil)}h`}
                    .
                  </span>
                )}
              </p>
              <CancelBookingButton
                bookingCode={b.booking_code}
                hasPaidPayment={hasPaidPayment}
              />
            </div>
          )}

          {isOwner && cancellableStatus && !within48 && (
            <p className="mt-8 pt-6 border-t border-[var(--color-charcoal-100)] text-xs text-[var(--color-charcoal-500)]">
              Cancelar pelo site só é possível até 48h antes da saída. Pra
              cancelar agora, fale com a gente pelo WhatsApp informando o código{' '}
              <strong className="text-[var(--color-charcoal-900)]">{b.booking_code}</strong>.
            </p>
          )}

          <Link
            href="/"
            className="block text-center mt-8 text-sm text-[var(--color-charcoal-500)] hover:text-[var(--color-red-600)] transition-colors"
          >
            Voltar para a home
          </Link>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-charcoal-500)] mb-1">
        {label}
      </dt>
      <dd className="text-[var(--color-charcoal-900)]">{children}</dd>
    </div>
  );
}
