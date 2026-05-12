import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const PRICE = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const DATETIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending_payment: { label: 'Pendente', cls: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Confirmada', cls: 'bg-green-100 text-green-800' },
  completed: { label: 'Concluída', cls: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelada', cls: 'bg-red-100 text-red-800' },
  refunded: { label: 'Reembolsada', cls: 'bg-blue-100 text-blue-800' },
};

const VIP_THRESHOLD_CENTS = 300000;

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: customer } = await admin
    .from('customers')
    .select('id, full_name, email, phone, cpf, is_guest, auth_user_id, created_at')
    .eq('id', id)
    .maybeSingle();

  if (!customer) notFound();

  // Bookings (todos os status, ordenados por created_at desc)
  const { data: bookings } = await admin
    .from('bookings')
    .select(
      `
      id,
      booking_code,
      status,
      passenger_count,
      total_cents,
      created_at,
      tour:tours ( name, slug, tour_type, is_test_only ),
      schedule:tour_schedules ( departure_at )
      `
    )
    .eq('customer_id', id)
    .order('created_at', { ascending: false });

  type BookingRow = {
    id: string;
    booking_code: string;
    status: string;
    passenger_count: number;
    total_cents: number;
    created_at: string;
    tour:
      | { name: string; slug: string; tour_type: string; is_test_only: boolean }
      | { name: string; slug: string; tour_type: string; is_test_only: boolean }[]
      | null;
    schedule: { departure_at: string } | { departure_at: string }[] | null;
  };
  const rows = (bookings ?? []) as unknown as BookingRow[];

  // Stats excluindo tour-de-teste e bookings sem pagamento
  const activeRows = rows.filter((b) => {
    const t = Array.isArray(b.tour) ? b.tour[0] : b.tour;
    return t && !t.is_test_only && ['confirmed', 'completed', 'refunded'].includes(b.status);
  });
  const totalSpent = activeRows.reduce((acc, b) => acc + b.total_cents, 0);
  const totalBookings = activeRows.length;
  const lastBooking = rows[0]?.created_at;

  const hasLancha = activeRows.some((b) => {
    const t = Array.isArray(b.tour) ? b.tour[0] : b.tour;
    return t?.tour_type === 'private';
  });

  const tags: Array<{ label: string; cls: string }> = [];
  if (totalSpent >= VIP_THRESHOLD_CENTS) {
    tags.push({ label: 'VIP', cls: 'bg-amber-100 text-amber-800' });
  }
  if (totalBookings > 1) {
    tags.push({ label: 'Recorrente', cls: 'bg-emerald-100 text-emerald-800' });
  }
  if (hasLancha) {
    tags.push({ label: 'Lancha', cls: 'bg-blue-100 text-blue-800' });
  }
  if (customer.is_guest) {
    tags.push({ label: 'Guest', cls: 'bg-gray-100 text-gray-700' });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <Link
          href="/admin/clientes"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Voltar para clientes
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-6 mb-6">
        <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
          <h1 className="text-2xl font-semibold">
            {customer.full_name || customer.email}
          </h1>
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <span
                key={t.label}
                className={`text-xs px-2 py-0.5 rounded ${t.cls}`}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase text-gray-500 mb-1">E-mail</dt>
            <dd>
              <a
                href={`mailto:${customer.email}`}
                className="text-[rgb(9,110,171)] hover:underline"
              >
                {customer.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-500 mb-1">Telefone</dt>
            <dd>{customer.phone ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-500 mb-1">CPF</dt>
            <dd>{customer.cpf ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-500 mb-1">Cadastro</dt>
            <dd>
              {customer.is_guest
                ? 'Guest (sem login)'
                : DATETIME.format(new Date(customer.created_at))}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <Kpi label="Reservas ativas" value={String(totalBookings)} />
        <Kpi label="Gasto total" value={PRICE.format(totalSpent / 100)} />
        <Kpi
          label="Última reserva"
          value={lastBooking ? DATETIME.format(new Date(lastBooking)) : '—'}
        />
      </div>

      <section className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Histórico ({rows.length} reserva{rows.length === 1 ? '' : 's'})
          </h2>
        </div>
        {rows.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500 text-center">
            Cliente sem reservas.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-2">Código</th>
                <th className="px-4 py-2">Tour</th>
                <th className="px-4 py-2 hidden md:table-cell">Saída</th>
                <th className="px-4 py-2 text-center">Pax</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => {
                const tour = Array.isArray(b.tour) ? b.tour[0] : b.tour;
                const sched = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
                const st = STATUS_LABEL[b.status] ?? {
                  label: b.status,
                  cls: 'bg-gray-100 text-gray-700',
                };
                return (
                  <tr key={b.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-mono text-xs">
                      <Link
                        href={`/admin/reservas/${b.booking_code}`}
                        className="text-[rgb(9,110,171)] hover:underline"
                      >
                        {b.booking_code}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      {tour?.name ?? '—'}
                      {tour?.is_test_only && (
                        <span className="ml-2 text-[10px] text-gray-500">(teste)</span>
                      )}
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell text-xs text-gray-600">
                      {sched?.departure_at
                        ? DATETIME.format(new Date(sched.departure_at))
                        : '—'}
                    </td>
                    <td className="px-4 py-2 text-center">{b.passenger_count}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {PRICE.format(b.total_cents / 100)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
