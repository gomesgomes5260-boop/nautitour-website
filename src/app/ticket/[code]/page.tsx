import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import Logo from '@/components/Logo';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ticket de embarque',
  description: 'Ticket de embarque Nautitour.',
  robots: { index: false, follow: false },
};

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

// Ticket público mostra só o mínimo necessário pro embarque:
// primeiro nome, saída, contagem de pax e píer. Sem email/telefone/CPF —
// o booking_code na URL não pode virar porta pra PII de outra pessoa.
function firstName(fullName: string | null): string | null {
  if (!fullName) return null;
  const first = fullName.trim().split(/\s+/)[0];
  return first || null;
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select(
      `
      id,
      booking_code,
      status,
      passenger_count,
      tour:tours ( name ),
      schedule:tour_schedules ( departure_at, pier:embarkation_piers ( name, address, fee_cents ) ),
      customer:customers ( full_name ),
      passengers:booking_passengers ( is_child )
      `
    )
    .eq('booking_code', code)
    .maybeSingle();

  if (!booking) notFound();

  type PierJoined = { name: string; address: string | null; fee_cents: number };
  type Joined = {
    id: string;
    booking_code: string;
    status: string;
    passenger_count: number;
    tour: { name: string } | { name: string }[] | null;
    schedule:
      | { departure_at: string; pier: PierJoined | PierJoined[] | null }
      | { departure_at: string; pier: PierJoined | PierJoined[] | null }[]
      | null;
    customer: { full_name: string | null } | { full_name: string | null }[] | null;
    passengers: { is_child: boolean }[] | null;
  };
  const b = booking as unknown as Joined;

  // Ticket só existe pra reserva paga (ou já embarcada). Qualquer outro
  // status responde 404 — não revela se o código existe.
  if (b.status !== 'confirmed' && b.status !== 'completed') notFound();

  const tour = Array.isArray(b.tour) ? b.tour[0] : b.tour;
  const schedule = Array.isArray(b.schedule) ? b.schedule[0] : b.schedule;
  const pier = schedule
    ? Array.isArray(schedule.pier)
      ? schedule.pier[0]
      : schedule.pier
    : null;
  const customer = Array.isArray(b.customer) ? b.customer[0] : b.customer;

  const children = (b.passengers ?? []).filter((p) => p.is_child).length;
  const adults = b.passenger_count - children;

  let qrDataUri: string | null = null;
  try {
    const QRCode = await import('qrcode');
    qrDataUri = await QRCode.toDataURL(b.booking_code, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 480,
    });
  } catch (err) {
    console.error('[ticket page] failed to generate QR', err);
  }

  const departureDate = schedule?.departure_at ? new Date(schedule.departure_at) : null;
  const name = firstName(customer?.full_name ?? null);

  return (
    <main className="min-h-screen bg-[var(--color-charcoal-50)] print:bg-white py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6 print:mb-4">
          <Logo variant="charcoal" />
        </div>

        <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white overflow-hidden shadow-[var(--shadow-2)] print:shadow-none print:border-[var(--color-charcoal-300)]">
          <div className="bg-[var(--color-charcoal-900)] text-white text-center py-4 px-6">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/70">
              Ticket de embarque
            </p>
            <p className="font-mono text-2xl font-bold tracking-wide mt-1">
              {b.booking_code}
            </p>
          </div>

          <div className="p-6 text-center">
            {qrDataUri && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrDataUri}
                alt={`QR code de embarque para ${b.booking_code}`}
                width={220}
                height={220}
                className="mx-auto block"
              />
            )}
            <p className="text-xs text-[var(--color-charcoal-500)] mt-3">
              Apresente este QR code no embarque
            </p>
            {b.status === 'completed' && (
              <p className="mt-3 inline-block rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3 py-1">
                Embarque realizado
              </p>
            )}
          </div>

          <dl className="border-t border-dashed border-[var(--color-charcoal-200)] px-6 py-5 grid grid-cols-2 gap-x-4 gap-y-4 text-left">
            {name && <Item label="Nome" full>{name}</Item>}
            <Item label="Passeio" full>{tour?.name ?? 'Passeio Nautitour'}</Item>
            {departureDate && (
              <>
                <Item label="Data">
                  <span className="capitalize">{DATE_FORMATTER.format(departureDate)}</span>
                </Item>
                <Item label="Horário">{TIME_FORMATTER.format(departureDate)}</Item>
              </>
            )}
            <Item label="Passageiros">
              {b.passenger_count} {b.passenger_count === 1 ? 'pessoa' : 'pessoas'}
              {children > 0 && (
                <span className="block text-xs text-[var(--color-charcoal-500)]">
                  {adults} inteira{adults === 1 ? '' : 's'} · {children} meia{children === 1 ? '' : 's'}
                </span>
              )}
            </Item>
            {pier && (
              <Item label="Embarque" full>
                {pier.name}
                {pier.address && (
                  <span className="block text-xs text-[var(--color-charcoal-500)]">
                    {pier.address}
                  </span>
                )}
                {pier.fee_cents > 0 && (
                  <span className="block text-xs text-[var(--color-red-600)] font-semibold mt-1">
                    Taxa de embarque R$ {(pier.fee_cents / 100).toFixed(2).replace('.', ',')}/pessoa
                    paga presencialmente na loja.
                  </span>
                )}
              </Item>
            )}
          </dl>
        </div>

        <div className="text-center mt-6 print:hidden">
          <PrintButton />
        </div>

        <p className="text-center text-xs text-[var(--color-charcoal-400)] mt-6">
          Nautitour · Passeios de barco em Armação dos Búzios
        </p>
      </div>
    </main>
  );
}

function Item({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? 'col-span-2' : undefined}>
      <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-charcoal-500)] mb-0.5">
        {label}
      </dt>
      <dd className="text-sm font-medium text-[var(--color-charcoal-900)]">{children}</dd>
    </div>
  );
}
