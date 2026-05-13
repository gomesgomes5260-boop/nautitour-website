import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import PrintButton from './PrintButton';
import BlockScheduleButton from './BlockScheduleButton';
import PierSelect from './PierSelect';
import type { Pier } from '@/lib/piers';

export const dynamic = 'force-dynamic';

const DATETIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default async function ManifestoSchedulePage({
  params,
}: {
  params: Promise<{ scheduleId: string }>;
}) {
  const { scheduleId } = await params;
  const admin = createAdminClient();

  const { data: schedule } = await admin
    .from('tour_schedules')
    .select(`
      id, departure_at, capacity, status, embarkation_pier_id,
      tour:tours ( name ),
      pier:embarkation_piers ( slug, name, fee_cents, address, notes )
    `)
    .eq('id', scheduleId)
    .maybeSingle();

  if (!schedule) notFound();
  type Sch = {
    id: string;
    departure_at: string;
    capacity: number;
    status: string;
    embarkation_pier_id: string;
    tour: { name: string } | { name: string }[] | null;
    pier:
      | { slug: string; name: string; fee_cents: number; address: string | null; notes: string | null }
      | { slug: string; name: string; fee_cents: number; address: string | null; notes: string | null }[]
      | null;
  };
  const s = schedule as unknown as Sch;
  const tour = Array.isArray(s.tour) ? s.tour[0] : s.tour;
  const currentPier = Array.isArray(s.pier) ? s.pier[0] : s.pier;

  // Lista de píeres ativos (RLS permite leitura pública)
  const { data: piersRaw } = await admin
    .from('embarkation_piers')
    .select('id, slug, name, fee_cents, address, is_default')
    .eq('active', true)
    .order('is_default', { ascending: false })
    .order('fee_cents', { ascending: true });
  const piers = (piersRaw ?? []) as Array<Pick<Pier, 'id' | 'slug' | 'name' | 'fee_cents' | 'address' | 'is_default'>>;

  const { data: bookings } = await admin
    .from('bookings')
    .select(
      `
      id,
      booking_code,
      passenger_count,
      status,
      customer:customers ( full_name, email, phone ),
      passengers:booking_passengers ( full_name, document, is_child )
    `
    )
    .eq('tour_schedule_id', scheduleId)
    .eq('status', 'confirmed')
    .order('booking_code', { ascending: true });

  type BookingRow = {
    id: string;
    booking_code: string;
    passenger_count: number;
    status: string;
    customer:
      | { full_name: string | null; email: string; phone: string | null }
      | { full_name: string | null; email: string; phone: string | null }[]
      | null;
    passengers: Array<{
      full_name: string;
      document: string | null;
      is_child: boolean;
    }>;
  };
  const rows = (bookings ?? []) as unknown as BookingRow[];

  const totalPax = rows.reduce((acc, r) => acc + r.passenger_count, 0);

  return (
    <div className="print:bg-white">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link
          href="/admin/manifesto"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Voltar
        </Link>
        <div className="flex gap-3">
          {s.status !== 'cancelled' && (
            <BlockScheduleButton
              scheduleId={s.id}
              confirmedBookings={rows.length}
            />
          )}
          <PrintButton />
        </div>
      </div>

      {s.status === 'cancelled' && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3 mb-4 text-sm print:hidden">
          Esta saída está <strong>cancelada</strong>. Não aparece nas listas
          públicas.
        </div>
      )}

      {/* Pier selector — só no painel, esconde no print */}
      <div className="mb-5 print:hidden">
        <PierSelect
          scheduleId={s.id}
          piers={piers.map((p) => ({
            slug: p.slug,
            name: p.name,
            fee_cents: p.fee_cents,
            address: p.address,
          }))}
          currentSlug={currentPier?.slug ?? 'rua-pedras'}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-6 print:border-0 print:rounded-none print:p-0">
        <header className="border-b border-gray-200 pb-4 mb-4">
          <h1 className="text-xl font-semibold">{tour?.name ?? '—'}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {DATETIME.format(new Date(s.departure_at))}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Passageiros confirmados: <strong>{totalPax}</strong> de {s.capacity}
          </p>
          {currentPier && (
            <p className="text-sm text-gray-700 mt-2">
              <strong>Embarque:</strong> {currentPier.name}
              {currentPier.address && (
                <span className="text-gray-500"> · {currentPier.address}</span>
              )}
              {currentPier.fee_cents > 0 && (
                <span className="ml-2 inline-block bg-amber-100 text-amber-900 text-xs font-bold px-2 py-0.5 rounded">
                  Taxa R$ {(currentPier.fee_cents / 100).toFixed(2).replace('.', ',')}/pax presencial
                </span>
              )}
            </p>
          )}
        </header>

        {rows.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">
            Nenhuma reserva confirmada para este horário.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-600 border-b border-gray-200">
              <tr>
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Reserva</th>
                <th className="py-2 pr-4">Passageiro</th>
                <th className="py-2 pr-4">Documento</th>
                <th className="py-2 pr-4">Tipo</th>
                <th className="py-2 pr-4">Contato</th>
              </tr>
            </thead>
            <tbody>
              {rows.flatMap((b, bi) => {
                const cust = Array.isArray(b.customer) ? b.customer[0] : b.customer;
                return b.passengers.map((p, pi) => (
                  <tr key={`${b.id}-${pi}`} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-500">
                      {bi + 1}.{pi + 1}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">
                      {b.booking_code}
                    </td>
                    <td className="py-2 pr-4">{p.full_name}</td>
                    <td className="py-2 pr-4 text-gray-700">
                      {p.document ?? '—'}
                    </td>
                    <td className="py-2 pr-4 text-gray-700">
                      {p.is_child ? 'Criança' : 'Adulto'}
                    </td>
                    <td className="py-2 pr-4 text-gray-700">
                      {pi === 0
                        ? `${cust?.full_name ?? ''} · ${cust?.phone ?? cust?.email ?? ''}`
                        : ''}
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
