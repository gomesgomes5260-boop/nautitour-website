import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';
import CancelButton from './CancelButton';
import RefundButton from './RefundButton';
import ResendEmailButton from './ResendEmailButton';

export const dynamic = 'force-dynamic';

type BookingStatus = Database['public']['Enums']['booking_status'];

const STATUS_LABEL: Record<BookingStatus, { label: string; cls: string; dot: string }> = {
  pending_payment: {
    label: 'Pendente',
    cls: 'bg-amber-50 text-amber-800',
    dot: 'bg-amber-500',
  },
  confirmed: {
    label: 'Confirmada',
    cls: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  completed: {
    label: 'Concluída',
    cls: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelada',
    cls: 'bg-[var(--color-red-50)] text-[var(--color-red-900)]',
    dot: 'bg-[var(--color-red-600)]',
  },
  refunded: {
    label: 'Reembolsada',
    cls: 'bg-sky-50 text-sky-700',
    dot: 'bg-sky-500',
  },
};

const EVENT_LABEL: Record<string, string> = {
  created: 'Reserva criada',
  payment_paid: 'Pagamento aprovado',
  payment_failed: 'Tentativa de pagamento recusada',
  admin_cancelled: 'Cancelada pelo admin',
  schedule_blocked: 'Saída bloqueada',
  refund_succeeded: 'Reembolso aprovado',
  refund_failed: 'Reembolso recusado pela operadora',
  email_resent: 'E-mail de confirmação reenviado',
};

const DATETIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const PRICE = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const admin = createAdminClient();

  const { data } = await admin
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
      confirmation_email_sent_at,
      notes,
      amount_paid_cents,
      manual_payment_method,
      needs_pickup,
      pickup_address,
      pickup_room,
      seller:sellers ( full_name, role ),
      tour:tours ( name, slug ),
      schedule:tour_schedules ( id, departure_at, capacity, status ),
      customer:customers ( full_name, email, phone, cpf ),
      passengers:booking_passengers ( full_name, document, birth_date, is_child ),
      payments:payments ( id, payment_method, amount_cents, status, paid_at, pagarme_charge_id, created_at )
      `
    )
    .eq('booking_code', code)
    .maybeSingle();

  if (!data) notFound();

  type Joined = {
    id: string;
    booking_code: string;
    status: BookingStatus;
    passenger_count: number;
    total_cents: number;
    currency: string;
    created_at: string;
    expires_at: string | null;
    confirmation_email_sent_at: string | null;
    notes: string | null;
    amount_paid_cents: number;
    manual_payment_method: string | null;
    needs_pickup: boolean;
    pickup_address: string | null;
    pickup_room: string | null;
    seller:
      | { full_name: string; role: string }
      | { full_name: string; role: string }[]
      | null;
    tour: { name: string; slug: string } | { name: string; slug: string }[] | null;
    schedule:
      | { id: string; departure_at: string; capacity: number; status: string }
      | { id: string; departure_at: string; capacity: number; status: string }[]
      | null;
    customer:
      | { full_name: string | null; email: string; phone: string | null; cpf: string | null }
      | { full_name: string | null; email: string; phone: string | null; cpf: string | null }[]
      | null;
    passengers: Array<{
      full_name: string;
      document: string | null;
      birth_date: string | null;
      is_child: boolean;
    }>;
    payments: Array<{
      id: string;
      payment_method: string;
      amount_cents: number;
      status: string;
      paid_at: string | null;
      pagarme_charge_id: string | null;
      created_at: string;
    }>;
  };
  const b = data as unknown as Joined;
  const seller = Array.isArray(b.seller) ? b.seller[0] : b.seller;
  const tour = Array.isArray(b.tour) ? b.tour[0] : b.tour;
  const schedule = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
  const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;
  const st = STATUS_LABEL[b.status];

  const { data: eventsRaw } = await admin
    .from('booking_events')
    .select('id, kind, payload, created_at, actor_user_id')
    .eq('booking_id', b.id)
    .order('created_at', { ascending: false });
  const events = eventsRaw ?? [];

  const hasPaidPayment = b.payments.some((p) => p.status === 'paid');
  const lastPaidPayment = [...b.payments]
    .filter((p) => p.status === 'paid')
    .sort((a, c) => {
      const ka = a.paid_at ?? a.created_at;
      const kc = c.paid_at ?? c.created_at;
      return kc.localeCompare(ka);
    })[0];
  const totalPaidCents = lastPaidPayment?.amount_cents ?? 0;
  const isCancellable = !['cancelled', 'refunded', 'completed'].includes(b.status);
  const canRefund = hasPaidPayment && b.status !== 'refunded';
  const canResendEmail = b.status === 'confirmed';

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link
          href="/admin/reservas"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-charcoal-500)] hover:text-[var(--color-charcoal-900)] transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar para reservas
        </Link>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${st.cls}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} aria-hidden />
          {st.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6">
            <div className="flex items-baseline justify-between mb-5 gap-3 flex-wrap">
              <h2
                className="font-mono font-bold text-[var(--color-charcoal-900)] tracking-tight"
                style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}
              >
                {b.booking_code}
              </h2>
              <span className="font-sans font-bold text-2xl text-[var(--color-red-600)]">
                {PRICE.format(b.total_cents / 100)}
              </span>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <Field label="Tour">{tour?.name ?? '—'}</Field>
              <Field label="Saída">
                {schedule?.departure_at
                  ? DATETIME.format(new Date(schedule.departure_at))
                  : '—'}
                {schedule?.status === 'cancelled' && (
                  <span className="ml-2 text-xs text-[var(--color-red-700)] font-semibold">
                    (saída cancelada)
                  </span>
                )}
              </Field>
              <Field label="Passageiros">{b.passenger_count}</Field>
              <Field label="Criado em">{DATETIME.format(new Date(b.created_at))}</Field>
              {b.expires_at && b.status === 'pending_payment' && (
                <Field label="Hold expira em">
                  {DATETIME.format(new Date(b.expires_at))}
                </Field>
              )}
              {b.confirmation_email_sent_at && (
                <Field label="E-mail enviado em">
                  {DATETIME.format(new Date(b.confirmation_email_sent_at))}
                </Field>
              )}
              {seller && (
                <Field label="Vendedor">
                  {seller.full_name}
                  {seller.role === 'agency' && (
                    <span className="ml-2 text-xs text-[var(--color-charcoal-500)]">(agência)</span>
                  )}
                </Field>
              )}
              {seller && (
                <Field label="Sinal recebido (manual)">
                  {PRICE.format(b.amount_paid_cents / 100)}
                  {b.manual_payment_method && (
                    <span className="ml-2 text-xs text-[var(--color-charcoal-500)]">
                      via {b.manual_payment_method}
                    </span>
                  )}
                </Field>
              )}
              {b.needs_pickup && (
                <Field label="Pickup">
                  {b.pickup_address ?? '—'}
                  {b.pickup_room && (
                    <span className="ml-2 text-xs text-[var(--color-charcoal-500)]">
                      quarto {b.pickup_room}
                    </span>
                  )}
                </Field>
              )}
              {b.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--color-charcoal-500)] mb-1">
                    Notas
                  </dt>
                  <dd className="whitespace-pre-wrap text-[var(--color-charcoal-900)] text-sm">
                    {b.notes}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)] mb-5">
              Cliente
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <Field label="Nome">{customer?.full_name ?? '—'}</Field>
              <Field label="E-mail">
                {customer?.email ? (
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-[var(--color-charcoal-700)] underline-offset-2 hover:underline"
                  >
                    {customer.email}
                  </a>
                ) : (
                  '—'
                )}
              </Field>
              <Field label="Telefone">{customer?.phone ?? '—'}</Field>
              <Field label="CPF">{customer?.cpf ?? '—'}</Field>
            </dl>
          </section>

          <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)] mb-5">
              Passageiros ({b.passengers.length})
            </h2>
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-charcoal-500)] border-b border-[var(--color-charcoal-100)]">
                <tr>
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Nome</th>
                  <th className="py-2 pr-4">Documento</th>
                  <th className="py-2 pr-4">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {b.passengers.map((p, idx) => (
                  <tr key={idx} className="border-b border-[var(--color-charcoal-100)] last:border-0">
                    <td className="py-2 pr-4 text-[var(--color-charcoal-500)]">{idx + 1}</td>
                    <td className="py-2 pr-4 text-[var(--color-charcoal-900)]">{p.full_name}</td>
                    <td className="py-2 pr-4 text-[var(--color-charcoal-700)]">
                      {p.document ?? '—'}
                    </td>
                    <td className="py-2 pr-4 text-[var(--color-charcoal-700)]">
                      {p.is_child ? 'Criança' : 'Adulto'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)] mb-5">
              Pagamentos ({b.payments.length})
            </h2>
            {b.payments.length === 0 ? (
              <p className="text-sm text-[var(--color-charcoal-500)]">
                Nenhum pagamento registrado.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-charcoal-500)] border-b border-[var(--color-charcoal-100)]">
                  <tr>
                    <th className="py-2 pr-4">Quando</th>
                    <th className="py-2 pr-4">Método</th>
                    <th className="py-2 pr-4">Valor</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Pagar.me ID</th>
                  </tr>
                </thead>
                <tbody>
                  {b.payments.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-[var(--color-charcoal-100)] last:border-0"
                    >
                      <td className="py-2 pr-4 text-[var(--color-charcoal-700)]">
                        {DATETIME.format(new Date(p.paid_at ?? p.created_at))}
                      </td>
                      <td className="py-2 pr-4 capitalize text-[var(--color-charcoal-900)]">
                        {p.payment_method}
                      </td>
                      <td className="py-2 pr-4 font-mono text-[var(--color-charcoal-900)]">
                        {PRICE.format(p.amount_cents / 100)}
                      </td>
                      <td className="py-2 pr-4 capitalize text-[var(--color-charcoal-700)]">
                        {p.status}
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs text-[var(--color-charcoal-500)]">
                        {p.pagarme_charge_id ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)] mb-5">
              Ações
            </h2>
            <div className="space-y-3">
              {canResendEmail && <ResendEmailButton bookingCode={b.booking_code} />}
              {isCancellable && (
                <CancelButton bookingCode={b.booking_code} isPaid={hasPaidPayment} />
              )}
              {canRefund && (
                <RefundButton
                  bookingCode={b.booking_code}
                  totalPaidCents={totalPaidCents}
                />
              )}
              {!isCancellable && !canRefund && !canResendEmail && (
                <p className="text-sm text-[var(--color-charcoal-500)]">
                  Nenhuma ação disponível neste estado.
                </p>
              )}
            </div>
          </section>

          <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)] mb-5">
              Histórico
            </h2>
            {events.length === 0 ? (
              <p className="text-sm text-[var(--color-charcoal-500)]">Sem eventos.</p>
            ) : (
              <ol className="space-y-3 text-sm">
                {events.map((e) => {
                  const payload = e.payload as Record<string, unknown> | null;
                  return (
                    <li
                      key={e.id}
                      className="relative border-l-2 border-[var(--color-charcoal-100)] pl-4"
                    >
                      <span
                        className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-[var(--color-red-600)]"
                        aria-hidden
                      />
                      <div className="font-medium text-[var(--color-charcoal-900)]">
                        {EVENT_LABEL[e.kind] ?? e.kind}
                      </div>
                      <div className="text-xs text-[var(--color-charcoal-500)] mt-0.5">
                        {DATETIME.format(new Date(e.created_at))}
                      </div>
                      {payload && 'reason' in payload && payload.reason ? (
                        <div className="text-xs text-[var(--color-charcoal-700)] mt-1 italic">
                          &ldquo;{String(payload.reason)}&rdquo;
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--color-charcoal-500)] mb-1">
        {label}
      </dt>
      <dd className="text-[var(--color-charcoal-900)]">{children}</dd>
    </div>
  );
}
