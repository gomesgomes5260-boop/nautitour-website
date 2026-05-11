import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';
import CancelButton from './CancelButton';
import RefundButton from './RefundButton';
import ResendEmailButton from './ResendEmailButton';

export const dynamic = 'force-dynamic';

type BookingStatus = Database['public']['Enums']['booking_status'];

const STATUS_LABEL: Record<BookingStatus, { label: string; cls: string }> = {
  pending_payment: { label: 'Pendente', cls: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Confirmada', cls: 'bg-green-100 text-green-800' },
  completed: { label: 'Concluída', cls: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelada', cls: 'bg-red-100 text-red-800' },
  refunded: { label: 'Reembolsada', cls: 'bg-blue-100 text-blue-800' },
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
  const isCancellable = !['cancelled', 'refunded', 'completed'].includes(b.status);
  const canRefund =
    hasPaidPayment && b.status !== 'refunded';
  const canResendEmail = b.status === 'confirmed';

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <Link
          href="/admin/reservas"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Voltar para reservas
        </Link>
        <span className={`inline-block px-3 py-1 rounded text-sm ${st.cls}`}>
          {st.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-gray-200 rounded-md p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {b.booking_code}
              </h2>
              <span className="text-2xl font-semibold text-[rgb(217,0,6)]">
                {PRICE.format(b.total_cents / 100)}
              </span>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase text-gray-500 mb-1">Tour</dt>
                <dd>{tour?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500 mb-1">Saída</dt>
                <dd>
                  {schedule?.departure_at
                    ? DATETIME.format(new Date(schedule.departure_at))
                    : '—'}
                  {schedule?.status === 'cancelled' && (
                    <span className="ml-2 text-xs text-red-700 font-semibold">
                      (saída cancelada)
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500 mb-1">Passageiros</dt>
                <dd>{b.passenger_count}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500 mb-1">Criado em</dt>
                <dd>{DATETIME.format(new Date(b.created_at))}</dd>
              </div>
              {b.expires_at && b.status === 'pending_payment' && (
                <div>
                  <dt className="text-xs uppercase text-gray-500 mb-1">Hold expira em</dt>
                  <dd>{DATETIME.format(new Date(b.expires_at))}</dd>
                </div>
              )}
              {b.confirmation_email_sent_at && (
                <div>
                  <dt className="text-xs uppercase text-gray-500 mb-1">E-mail enviado em</dt>
                  <dd>{DATETIME.format(new Date(b.confirmation_email_sent_at))}</dd>
                </div>
              )}
              {b.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase text-gray-500 mb-1">Notas</dt>
                  <dd className="whitespace-pre-wrap text-gray-800 text-sm">{b.notes}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="bg-white border border-gray-200 rounded-md p-6">
            <h2 className="text-lg font-semibold mb-4">Cliente</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase text-gray-500 mb-1">Nome</dt>
                <dd>{customer?.full_name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500 mb-1">E-mail</dt>
                <dd>
                  {customer?.email ? (
                    <a href={`mailto:${customer.email}`} className="text-[rgb(9,110,171)] hover:underline">
                      {customer.email}
                    </a>
                  ) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500 mb-1">Telefone</dt>
                <dd>{customer?.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500 mb-1">CPF</dt>
                <dd>{customer?.cpf ?? '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="bg-white border border-gray-200 rounded-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              Passageiros ({b.passengers.length})
            </h2>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Nome</th>
                  <th className="py-2 pr-4">Documento</th>
                  <th className="py-2 pr-4">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {b.passengers.map((p, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-500">{idx + 1}</td>
                    <td className="py-2 pr-4">{p.full_name}</td>
                    <td className="py-2 pr-4 text-gray-700">{p.document ?? '—'}</td>
                    <td className="py-2 pr-4 text-gray-700">
                      {p.is_child ? 'Criança' : 'Adulto'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="bg-white border border-gray-200 rounded-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              Pagamentos ({b.payments.length})
            </h2>
            {b.payments.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum pagamento registrado.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-gray-600 border-b border-gray-200">
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
                    <tr key={p.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4 text-gray-700">
                        {DATETIME.format(new Date(p.paid_at ?? p.created_at))}
                      </td>
                      <td className="py-2 pr-4 capitalize">{p.payment_method}</td>
                      <td className="py-2 pr-4">{PRICE.format(p.amount_cents / 100)}</td>
                      <td className="py-2 pr-4 capitalize">{p.status}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-gray-500">
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
          <section className="bg-white border border-gray-200 rounded-md p-6">
            <h2 className="text-lg font-semibold mb-4">Ações</h2>
            <div className="space-y-3">
              {canResendEmail && (
                <ResendEmailButton bookingCode={b.booking_code} />
              )}
              {isCancellable && (
                <CancelButton
                  bookingCode={b.booking_code}
                  isPaid={hasPaidPayment}
                />
              )}
              {canRefund && (
                <RefundButton bookingCode={b.booking_code} />
              )}
              {!isCancellable && !canRefund && !canResendEmail && (
                <p className="text-sm text-gray-500">
                  Nenhuma ação disponível neste estado.
                </p>
              )}
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-md p-6">
            <h2 className="text-lg font-semibold mb-4">Histórico</h2>
            {events.length === 0 ? (
              <p className="text-sm text-gray-500">Sem eventos.</p>
            ) : (
              <ol className="space-y-3 text-sm">
                {events.map((e) => {
                  const payload = e.payload as Record<string, unknown> | null;
                  return (
                    <li key={e.id} className="border-l-2 border-gray-200 pl-3">
                      <div className="font-medium text-gray-800">
                        {EVENT_LABEL[e.kind] ?? e.kind}
                      </div>
                      <div className="text-xs text-gray-500">
                        {DATETIME.format(new Date(e.created_at))}
                      </div>
                      {payload && 'reason' in payload && payload.reason ? (
                        <div className="text-xs text-gray-700 mt-1 italic">
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
