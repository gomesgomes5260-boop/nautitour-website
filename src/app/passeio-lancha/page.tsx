import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

// WhatsApp number for custom-time inquiries (international format, digits only)
const WHATSAPP_NUMBER = '5522997734466';
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Olá! Gostaria de consultar um horário diferente para a lancha privativa.'
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

function formatPrice(cents: number | null | undefined) {
  if (cents == null) return null;
  return PRICE_FORMATTER.format(cents / 100);
}

export default async function PasseioLanchaPage() {
  const supabase = await createClient();

  const { data: tour, error: tourError } = await supabase
    .from('tours')
    .select('*')
    .eq('slug', 'lancha-privativa')
    .eq('active', true)
    .maybeSingle();

  if (tourError) throw tourError;
  if (!tour) notFound();

  const { data: schedules, error: schedulesError } = await supabase
    .from('tour_schedules')
    .select('id, departure_at, capacity, seats_taken, price_cents, status')
    .eq('tour_id', tour.id)
    .gte('departure_at', new Date().toISOString())
    .neq('status', 'cancelled')
    .order('departure_at', { ascending: true })
    .limit(30);

  if (schedulesError) throw schedulesError;

  const highlights = Array.isArray(tour.highlights)
    ? (tour.highlights as string[])
    : [];

  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="px-[60px] py-12 max-w-7xl mx-auto">
          <h1 className="text-[41px] font-normal mb-4" style={{ color: 'rgb(219, 56, 44)' }}>
            {tour.name}
          </h1>
          {tour.description && (
            <p className="text-lg text-gray-700 mb-8 max-w-3xl">{tour.description}</p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="relative w-full h-[400px] rounded-lg overflow-hidden mb-6">
                <Image
                  src={tour.cover_image_url ?? '/images/photos/misc/cruzeiro-vista-01.jpg'}
                  alt={tour.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {highlights.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(9, 110, 171)' }}>
                    Destaques
                  </h2>
                  <ul className="space-y-2">
                    {highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-gray-700">
                        <span style={{ color: 'rgb(219, 56, 44)' }}>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <p className="text-sm text-gray-600 mb-1">Preço fixo do barco</p>
                <p className="text-3xl font-bold mb-4" style={{ color: 'rgb(219, 56, 44)' }}>
                  {formatPrice(tour.base_price_cents) ?? 'Sob consulta'}
                </p>
                {tour.duration_minutes && (
                  <p className="text-sm text-gray-600">
                    Duração: {Math.round(tour.duration_minutes / 60)}h
                  </p>
                )}
                {tour.max_capacity && (
                  <p className="text-sm text-gray-600">
                    Capacidade: até {tour.max_capacity} pessoas
                  </p>
                )}
              </div>

              <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(9, 110, 171)' }}>
                Horários disponíveis
              </h2>
              {schedules && schedules.length > 0 ? (
                <ul className="space-y-3 mb-6">
                  {schedules.map((schedule) => {
                    const isSoldOut = schedule.status === 'sold_out';
                    const price =
                      formatPrice(schedule.price_cents) ?? formatPrice(tour.base_price_cents);

                    return (
                      <li
                        key={schedule.id}
                        className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
                      >
                        <div>
                          <p className="font-medium text-gray-800 capitalize">
                            {DATE_FORMATTER.format(new Date(schedule.departure_at))}
                          </p>
                          <p className="text-xs text-gray-500">
                            {isSoldOut ? 'Reservado' : `Disponível${price ? ` • ${price}` : ''}`}
                          </p>
                        </div>
                        {isSoldOut ? (
                          <button
                            disabled
                            className="px-6 py-2 text-white text-sm font-medium rounded-full opacity-50 cursor-not-allowed"
                            style={{ backgroundColor: 'rgb(9, 110, 171)' }}
                          >
                            Reservado
                          </button>
                        ) : (
                          <Link
                            href={`/checkout/${schedule.id}`}
                            className="px-6 py-2 text-white text-sm font-medium rounded-full"
                            style={{ backgroundColor: 'rgb(9, 110, 171)' }}
                          >
                            Reservar
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-gray-600 mb-6">
                  Nenhum horário disponível no momento.
                </p>
              )}

              {/* Custom-time inquiry: opens WhatsApp directly */}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block border-2 border-dashed rounded-lg p-4 hover:bg-gray-50 transition-colors"
                style={{ borderColor: 'rgb(9, 110, 171)' }}
              >
                <p className="font-semibold mb-1" style={{ color: 'rgb(9, 110, 171)' }}>
                  Outro horário?
                </p>
                <p className="text-sm text-gray-600">
                  Consulte disponibilidade e valores diretamente pelo WhatsApp.
                </p>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
