import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Star, Clock, Users, Check } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Container from '@/components/Container';
import DateScheduleSelector from '@/components/DateScheduleSelector';
import { createClient } from '@/lib/supabase/server';
import { formatDuration } from '@/lib/format-duration';

export const dynamic = 'force-dynamic';

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatPrice(cents: number | null | undefined) {
  if (cents == null) return null;
  return PRICE_FORMATTER.format(cents / 100);
}

export default async function PasseioEscunaPage() {
  const supabase = await createClient();

  const { data: tour, error: tourError } = await supabase
    .from('tours')
    .select('*')
    .eq('slug', 'escuna-publica')
    .eq('active', true)
    .maybeSingle();

  if (tourError) throw tourError;
  if (!tour) notFound();

  const { data: schedules, error: schedulesError } = await supabase
    .from('tour_schedules')
    .select(`id, departure_at, capacity, seats_taken, price_cents, status, pier:embarkation_piers ( slug, name, fee_cents )`)
    .eq('tour_id', tour.id)
    .gte('departure_at', new Date().toISOString())
    .neq('status', 'cancelled')
    .order('departure_at', { ascending: true })
    .limit(200);

  if (schedulesError) throw schedulesError;

  type ScheduleRaw = {
    id: string;
    departure_at: string;
    capacity: number;
    seats_taken: number;
    price_cents: number | null;
    status: string;
    pier:
      | { slug: string; name: string; fee_cents: number }
      | { slug: string; name: string; fee_cents: number }[]
      | null;
  };
  const schedulesNormalized = ((schedules ?? []) as unknown as ScheduleRaw[]).map((s) => ({
    id: s.id,
    departure_at: s.departure_at,
    capacity: s.capacity,
    seats_taken: s.seats_taken,
    price_cents: s.price_cents,
    status: s.status,
    pier: Array.isArray(s.pier) ? s.pier[0] : s.pier,
  }));

  const highlights = Array.isArray(tour.highlights) ? (tour.highlights as string[]) : [];

  return (
    <>
      <Header />
      <main className="bg-[var(--color-charcoal-50)]">
        {/* === HERO === */}
        <section className="relative w-full overflow-hidden">
          <Image
            src={tour.cover_image_url ?? '/images/photos/escuna/escuna-pier-01.jpg'}
            alt={tour.name}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, rgba(31,31,31,0.78) 0%, rgba(31,31,31,0.5) 50%, rgba(31,31,31,0.15) 100%)',
            }}
          />
          <Container className="relative py-16 sm:py-20 md:py-24">
            <span className="inline-block text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-300)] mb-4">
              Passeio em grupo · Búzios
            </span>
            <h1
              className="font-display text-white font-semibold tracking-tight max-w-3xl"
              style={{
                fontSize: 'clamp(1.875rem, 6vw, 4rem)',
                lineHeight: '1.08',
                letterSpacing: '-0.02em',
              }}
            >
              {tour.name}
            </h1>
            {tour.description && (
              <p className="text-white/85 text-sm sm:text-base md:text-lg leading-relaxed mt-4 max-w-2xl">
                {tour.description}
              </p>
            )}
          </Container>
        </section>

        {/* === MAIN — 2 cols (info esquerda + card sticky direita) === */}
        <section className="py-12 sm:py-16 md:py-20">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* === LEFT: tour info === */}
              <div className="lg:col-span-7">
                {highlights.length > 0 && (
                  <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-8 mb-6">
                    <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)]">
                      O que está incluso
                    </span>
                    <h2
                      className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mt-2 mb-5"
                      style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', lineHeight: '1.15' }}
                    >
                      Destaques do roteiro.
                    </h2>
                    <ul className="space-y-3">
                      {highlights.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-sm sm:text-base text-[var(--color-charcoal-700)]"
                        >
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-red-50)] text-[var(--color-red-600)] mt-0.5 shrink-0">
                            <Check size={14} />
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-8">
                  <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)]">
                    Detalhes
                  </span>
                  <h2
                    className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mt-2 mb-5"
                    style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', lineHeight: '1.15' }}
                  >
                    Tudo claro, sem letra miúda.
                  </h2>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    {tour.duration_minutes && (
                      <DetailItem
                        Icon={Clock}
                        label="Duração"
                        value={`${formatDuration(tour.duration_minutes)} de passeio`}
                      />
                    )}
                    {tour.max_capacity && (
                      <DetailItem
                        Icon={Users}
                        label="Grupo"
                        value={`Até ${tour.max_capacity} pessoas a bordo`}
                      />
                    )}
                    <DetailItem
                      Icon={Star}
                      label="Avaliação"
                      value="4.9 · 280+ passageiros"
                    />
                  </div>
                </div>
              </div>

              {/* === RIGHT: booking sticky card === */}
              <aside className="lg:col-span-5 lg:sticky lg:top-24 self-start">
                <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white overflow-hidden shadow-[var(--shadow-2)]">
                  <div className="p-5 sm:p-6 border-b border-[var(--color-charcoal-100)]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Star
                        size={13}
                        className="fill-[var(--color-red-600)] text-[var(--color-red-600)]"
                      />
                      <span className="font-sans font-bold text-sm text-[var(--color-charcoal-900)]">
                        4.9
                      </span>
                      <span className="text-xs text-[var(--color-charcoal-500)]">
                        · 280+ passageiros
                      </span>
                    </div>
                    <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-charcoal-500)] mb-0.5">
                      A partir de
                    </p>
                    <p className="font-sans text-2xl sm:text-3xl font-black text-[var(--color-red-600)] leading-tight">
                      {formatPrice(tour.base_price_cents) ?? 'Sob consulta'}
                      <span className="text-sm font-normal text-[var(--color-charcoal-500)]">
                        {' '}/ pessoa
                      </span>
                    </p>
                  </div>
                  <div className="p-5 sm:p-6">
                    <h3 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-charcoal-700)] mb-4">
                      Escolha sua data
                    </h3>
                    <DateScheduleSelector
                      schedules={schedulesNormalized}
                      fallbackPriceCents={tour.base_price_cents ?? null}
                      pricingMode="per_passenger"
                      soldOutLabel="Esgotado"
                    />
                  </div>
                </div>
              </aside>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}

function DetailItem({
  Icon,
  label,
  value,
}: {
  Icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-red-50)] text-[var(--color-red-600)] shrink-0">
        <Icon size={18} />
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-charcoal-500)]">
          {label}
        </p>
        <p className="text-sm sm:text-base font-semibold text-[var(--color-charcoal-900)] leading-tight mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}
