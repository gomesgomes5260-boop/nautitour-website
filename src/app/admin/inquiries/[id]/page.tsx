import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatWaNumber } from '@/lib/whatsapp';
import type { Database } from '@/lib/supabase/database.types';
import InquiryActions from './InquiryActions';
import ConvertInquiryButton from './ConvertInquiryButton';

export const dynamic = 'force-dynamic';

type InquiryStatus = Database['public']['Enums']['inquiry_status'];

const STATUS_LABEL: Record<InquiryStatus, { label: string; cls: string; dot: string }> = {
  new: {
    label: 'Novo',
    cls: 'bg-amber-50 text-amber-800',
    dot: 'bg-amber-500',
  },
  contacted: {
    label: 'Contactado',
    cls: 'bg-sky-50 text-sky-700',
    dot: 'bg-sky-500',
  },
  won: {
    label: 'Ganho',
    cls: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  lost: {
    label: 'Perdido',
    cls: 'bg-[var(--color-charcoal-100)] text-[var(--color-charcoal-700)]',
    dot: 'bg-[var(--color-charcoal-400)]',
  },
};

const DATETIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const DATE_ONLY = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data } = await admin
    .from('inquiry_requests')
    .select(
      `
      id,
      status,
      requested_date,
      start_time,
      end_time,
      passenger_count,
      interested_in_open_bar,
      message,
      admin_notes,
      whatsapp_contacted_at,
      wa_number,
      created_via,
      status_changed_at,
      created_at,
      customer:customers ( full_name, email, phone, cpf ),
      tour:tours ( name, slug )
      `
    )
    .eq('id', id)
    .maybeSingle();

  if (!data) notFound();

  type Joined = {
    id: string;
    status: InquiryStatus;
    requested_date: string | null;
    start_time: string | null;
    end_time: string | null;
    passenger_count: number | null;
    interested_in_open_bar: boolean;
    message: string | null;
    admin_notes: string | null;
    whatsapp_contacted_at: string | null;
    wa_number: string | null;
    created_via: string;
    status_changed_at: string | null;
    created_at: string;
    customer:
      | { full_name: string | null; email: string; phone: string | null; cpf: string | null }
      | { full_name: string | null; email: string; phone: string | null; cpf: string | null }[]
      | null;
    tour: { name: string; slug: string } | { name: string; slug: string }[] | null;
  };
  const i = data as unknown as Joined;
  const cust = Array.isArray(i.customer) ? i.customer[0] : i.customer;
  const tour = Array.isArray(i.tour) ? i.tour[0] : i.tour;
  const st = STATUS_LABEL[i.status];

  // Lookup booking convertido via booking_events.kind='converted_from_inquiry'
  const { data: convertedEvent } = await admin
    .from('booking_events')
    .select('booking_id, created_at')
    .eq('kind', 'converted_from_inquiry')
    .contains('payload', { inquiry_id: i.id })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let convertedBooking: {
    booking_code: string;
    status: string;
    payment_link_token: string | null;
  } | null = null;
  if (convertedEvent?.booking_id) {
    const { data: b } = await admin
      .from('bookings')
      .select('booking_code, status, payment_link_token')
      .eq('id', convertedEvent.booking_id)
      .maybeSingle();
    if (b) convertedBooking = b;
  }

  // Histórico completo de mudanças de status (inquiry_events, migration 040)
  const { data: statusEvents } = await admin
    .from('inquiry_events')
    .select('id, from_status, to_status, actor_email, created_at')
    .eq('inquiry_id', i.id)
    .order('created_at', { ascending: true });

  // Defaults pro modal de conversão (datetime-local sem TZ, BRT implícito)
  const todayPlus3 = new Date();
  todayPlus3.setDate(todayPlus3.getDate() + 3);
  const defaultDepartureAt = (() => {
    if (i.requested_date) {
      const time = i.start_time?.slice(0, 5) ?? '09:00';
      return `${i.requested_date}T${time}`;
    }
    const yyyy = todayPlus3.getFullYear();
    const mm = String(todayPlus3.getMonth() + 1).padStart(2, '0');
    const dd = String(todayPlus3.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T09:00`;
  })();
  const paxNote = `Inquiry: ${i.passenger_count ?? '?'} pax · ${
    i.interested_in_open_bar ? 'com open bar' : 'sem open bar'
  }`;
  const defaultPriceBRL = '';
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

  const whatsappText = encodeURIComponent(
    `Olá, ${cust?.full_name ?? ''}! Recebemos seu pedido de locação privativa da escuna para ${
      i.requested_date
        ? DATE_ONLY.format(new Date(`${i.requested_date}T12:00:00`))
        : 'a data informada'
    }.`
  );
  const phoneDigits = (cust?.phone ?? '').replace(/\D/g, '');
  const whatsappLink = phoneDigits
    ? `https://wa.me/55${phoneDigits.replace(/^55/, '')}?text=${whatsappText}`
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link
          href="/admin/inquiries"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-charcoal-500)] hover:text-[var(--color-charcoal-900)] transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar para inquiries
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
            <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)] mb-5">
              Detalhes do pedido
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <Field label="Tour">{tour?.name ?? '—'}</Field>
              <Field label="Recebido em">{DATETIME.format(new Date(i.created_at))}</Field>
              <Field label="Origem">
                {i.created_via === 'manual' ? 'Registrado manualmente (operador)' : 'Formulário do site'}
              </Field>
              <Field label="WhatsApp direcionado">
                {i.wa_number ? formatWaNumber(i.wa_number) : '—'}
              </Field>
              <div className="sm:col-span-2">
                <dt className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--color-charcoal-500)] mb-1">
                  Data desejada
                </dt>
                <dd className="capitalize text-[var(--color-charcoal-900)]">
                  {i.requested_date
                    ? DATE_ONLY.format(new Date(`${i.requested_date}T12:00:00`))
                    : '—'}
                  {i.start_time && i.end_time && (
                    <span className="ml-2 text-[var(--color-charcoal-700)] font-mono">
                      {i.start_time.slice(0, 5)} às {i.end_time.slice(0, 5)}
                    </span>
                  )}
                </dd>
              </div>
              <Field label="Passageiros">{i.passenger_count ?? '—'}</Field>
              <Field label="Open bar">
                {i.interested_in_open_bar ? 'Sim, tem interesse' : 'Não'}
              </Field>
              {i.message && (
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--color-charcoal-500)] mb-1">
                    Mensagem do cliente
                  </dt>
                  <dd className="whitespace-pre-wrap text-[var(--color-charcoal-900)]">
                    {i.message}
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
              <Field label="Nome">{cust?.full_name ?? '—'}</Field>
              <Field label="E-mail">
                {cust?.email ? (
                  <a
                    href={`mailto:${cust.email}`}
                    className="text-[var(--color-charcoal-700)] underline-offset-2 hover:underline"
                  >
                    {cust.email}
                  </a>
                ) : (
                  '—'
                )}
              </Field>
              <Field label="Telefone">
                {cust?.phone ? (
                  whatsappLink ? (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[var(--color-charcoal-700)] underline-offset-2 hover:underline"
                    >
                      {cust.phone}
                      <MessageCircle size={14} className="text-emerald-600" />
                    </a>
                  ) : (
                    cust.phone
                  )
                ) : (
                  '—'
                )}
              </Field>
              <Field label="CPF">{cust?.cpf ?? '—'}</Field>
            </dl>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)] mb-5">
              Histórico
            </h2>
            <ul className="text-sm space-y-3 text-[var(--color-charcoal-700)]">
              <li className="relative border-l-2 border-[var(--color-charcoal-100)] pl-4">
                <span
                  className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-[var(--color-red-600)]"
                  aria-hidden
                />
                <strong className="text-[var(--color-charcoal-900)]">Criado:</strong>{' '}
                {DATETIME.format(new Date(i.created_at))}
              </li>
              {i.whatsapp_contacted_at && (
                <li className="relative border-l-2 border-[var(--color-charcoal-100)] pl-4">
                  <span
                    className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-[var(--color-red-600)]"
                    aria-hidden
                  />
                  <strong className="text-[var(--color-charcoal-900)]">
                    WhatsApp aberto:
                  </strong>{' '}
                  {DATETIME.format(new Date(i.whatsapp_contacted_at))}
                </li>
              )}
              {(statusEvents ?? []).map((ev) => (
                <li
                  key={ev.id}
                  className="relative border-l-2 border-[var(--color-charcoal-100)] pl-4"
                >
                  <span
                    className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-[var(--color-red-600)]"
                    aria-hidden
                  />
                  <strong className="text-[var(--color-charcoal-900)]">
                    {STATUS_LABEL[(ev.from_status ?? '') as InquiryStatus]?.label ?? 'Criado'}
                    {' → '}
                    {STATUS_LABEL[ev.to_status as InquiryStatus]?.label ?? ev.to_status}:
                  </strong>{' '}
                  {DATETIME.format(new Date(ev.created_at))}
                  {ev.actor_email && (
                    <span className="block text-xs text-[var(--color-charcoal-500)]">
                      por {ev.actor_email}
                    </span>
                  )}
                </li>
              ))}
              {(statusEvents ?? []).length === 0 && i.status_changed_at && (
                <li className="relative border-l-2 border-[var(--color-charcoal-100)] pl-4">
                  <span
                    className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-[var(--color-red-600)]"
                    aria-hidden
                  />
                  <strong className="text-[var(--color-charcoal-900)]">
                    Status atualizado:
                  </strong>{' '}
                  {DATETIME.format(new Date(i.status_changed_at))}
                </li>
              )}
            </ul>
          </section>

          <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)] mb-5">
              Ações
            </h2>
            {convertedBooking ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm mb-4">
                <p className="font-semibold text-emerald-900 mb-1.5">
                  Convertido em reserva
                </p>
                <Link
                  href={`/admin/reservas/${convertedBooking.booking_code}`}
                  className="text-[var(--color-charcoal-700)] underline-offset-2 hover:underline font-mono"
                >
                  {convertedBooking.booking_code} →
                </Link>
                {convertedBooking.payment_link_token &&
                  convertedBooking.status === 'pending_payment' && (
                    <div className="mt-3 text-xs text-[var(--color-charcoal-700)]">
                      <strong className="text-[var(--color-charcoal-900)]">
                        Link de pagamento
                      </strong>{' '}
                      (manda pro cliente):
                      <div className="mt-1 p-2 bg-white border border-[var(--color-charcoal-100)] rounded-lg font-mono break-all text-[var(--color-charcoal-900)]">
                        {siteUrl}/pagar/{convertedBooking.payment_link_token}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              (i.status === 'new' || i.status === 'contacted') && (
                <div className="mb-4">
                  <ConvertInquiryButton
                    inquiryId={i.id}
                    defaultDepartureAt={defaultDepartureAt}
                    defaultPaxNote={paxNote}
                    defaultPriceBRL={defaultPriceBRL}
                  />
                </div>
              )
            )}
            <InquiryActions
              inquiryId={i.id}
              currentStatus={i.status}
              initialNotes={i.admin_notes ?? ''}
            />
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
