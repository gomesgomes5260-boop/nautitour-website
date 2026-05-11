import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';
import InquiryActions from './InquiryActions';

export const dynamic = 'force-dynamic';

type InquiryStatus = Database['public']['Enums']['inquiry_status'];

const STATUS_LABEL: Record<InquiryStatus, { label: string; cls: string }> = {
  new: { label: 'Novo', cls: 'bg-amber-100 text-amber-800' },
  contacted: { label: 'Contactado', cls: 'bg-blue-100 text-blue-800' },
  won: { label: 'Ganho', cls: 'bg-green-100 text-green-800' },
  lost: { label: 'Perdido', cls: 'bg-gray-100 text-gray-700' },
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
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/admin/inquiries"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Voltar para inquiries
        </Link>
        <span className={`inline-block px-3 py-1 rounded text-sm ${st.cls}`}>
          {st.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-gray-200 rounded-md p-6">
            <h2 className="text-lg font-semibold mb-4">Detalhes do pedido</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase text-gray-500 mb-1">Tour</dt>
                <dd>{tour?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500 mb-1">Recebido em</dt>
                <dd>{DATETIME.format(new Date(i.created_at))}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase text-gray-500 mb-1">Data desejada</dt>
                <dd className="capitalize">
                  {i.requested_date
                    ? DATE_ONLY.format(new Date(`${i.requested_date}T12:00:00`))
                    : '—'}
                  {i.start_time && i.end_time && (
                    <span className="ml-2 text-gray-700 font-mono">
                      {i.start_time.slice(0, 5)} às {i.end_time.slice(0, 5)}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500 mb-1">Passageiros</dt>
                <dd>{i.passenger_count ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500 mb-1">Open bar</dt>
                <dd>{i.interested_in_open_bar ? 'Sim, tem interesse' : 'Não'}</dd>
              </div>
              {i.message && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase text-gray-500 mb-1">Mensagem do cliente</dt>
                  <dd className="whitespace-pre-wrap text-gray-800">{i.message}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="bg-white border border-gray-200 rounded-md p-6">
            <h2 className="text-lg font-semibold mb-4">Cliente</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase text-gray-500 mb-1">Nome</dt>
                <dd>{cust?.full_name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500 mb-1">E-mail</dt>
                <dd>
                  {cust?.email ? (
                    <a href={`mailto:${cust.email}`} className="text-[rgb(9,110,171)] hover:underline">
                      {cust.email}
                    </a>
                  ) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500 mb-1">Telefone</dt>
                <dd>
                  {cust?.phone ? (
                    whatsappLink ? (
                      <a href={whatsappLink} target="_blank" rel="noreferrer" className="text-[rgb(9,110,171)] hover:underline">
                        {cust.phone} · WhatsApp
                      </a>
                    ) : (
                      cust.phone
                    )
                  ) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500 mb-1">CPF</dt>
                <dd>{cust?.cpf ?? '—'}</dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="bg-white border border-gray-200 rounded-md p-6">
            <h2 className="text-lg font-semibold mb-4">Histórico</h2>
            <ul className="text-sm space-y-2 text-gray-700">
              <li>
                <strong>Criado:</strong> {DATETIME.format(new Date(i.created_at))}
              </li>
              {i.whatsapp_contacted_at && (
                <li>
                  <strong>WhatsApp aberto:</strong>{' '}
                  {DATETIME.format(new Date(i.whatsapp_contacted_at))}
                </li>
              )}
              {i.status_changed_at && (
                <li>
                  <strong>Status atualizado:</strong>{' '}
                  {DATETIME.format(new Date(i.status_changed_at))}
                </li>
              )}
            </ul>
          </section>

          <section className="bg-white border border-gray-200 rounded-md p-6">
            <h2 className="text-lg font-semibold mb-4">Ações</h2>
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
