import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Star, Clock, Users, Check, Anchor, Waves, Utensils, Info } from 'lucide-react';
import { formatPierFeeShort } from '@/lib/piers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Container from '@/components/Container';
import DateScheduleSelector from '@/components/DateScheduleSelector';
import ViewItemTracker from '@/components/ViewItemTracker';
import PhotoGallery from '@/components/PhotoGallery';
import LanchaUpsell from '@/components/LanchaUpsell';
import TourJsonLd from '@/components/TourJsonLd';
import { PASSEIO_ESCUNA_GALLERY } from '@/lib/photo-gallery';
import { getGalleryPhotos } from '@/lib/gallery';
import { createClient } from '@/lib/supabase/server';
import { formatDuration } from '@/lib/format-duration';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Passeio de Escuna em Búzios — Sáb/Dom 09:30 e 12:00',
  description:
    'Passeio de escuna em Armação dos Búzios. Saídas diárias com duração de 2h30, capacidade 120 pessoas. Reserve online com Pix ou cartão a partir de R$ 60/pessoa.',
  alternates: { canonical: '/passeio-escuna' },
  openGraph: {
    title: 'Passeio de Escuna em Búzios | Nautitour',
    description:
      'Saídas diárias em Armação dos Búzios. 2h30 de passeio, parada para banho nas ilhas. A partir de R$ 60/pessoa.',
    url: '/passeio-escuna',
    images: ['/images/photos/escuna/escuna-pier-01.jpg'],
  },
};

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

  // Píeres ativos pro aviso de taxa de embarque (RLS pública).
  const { data: piers } = await supabase
    .from('embarkation_piers')
    .select('slug, name, fee_cents')
    .eq('active', true)
    .order('fee_cents', { ascending: true });
  const paidPiers = (piers ?? []).filter((p) => p.fee_cents > 0);

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
      <ViewItemTracker
        itemId="escuna-publica"
        itemName={tour.name}
        valueBRL={tour.base_price_cents != null ? tour.base_price_cents / 100 : null}
      />
      <TourJsonLd
        name={tour.name}
        description={tour.description ?? 'Passeio de escuna em Armação dos Búzios.'}
        imageUrl={tour.cover_image_url ?? '/images/photos/escuna/escuna-pier-01.jpg'}
        priceCents={tour.base_price_cents}
        durationMinutes={tour.duration_minutes}
        maxCapacity={tour.max_capacity}
        url={`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nautitour-website.vercel.app'}/passeio-escuna`}
      />
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

                {/* === Roteiro (conteúdo do folder oficial, pedido 12/ago) === */}
                <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-8 mb-6">
                  <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)]">
                    Roteiro
                  </span>
                  <h2
                    className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mt-2 mb-3"
                    style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', lineHeight: '1.15' }}
                  >
                    Por onde a escuna navega.
                  </h2>
                  <p className="text-sm sm:text-base text-[var(--color-charcoal-600)] leading-relaxed mb-6">
                    Ao longo de {formatDuration(tour.duration_minutes ?? 150)} de passeio, você
                    passa por <strong>12 praias e 3 ilhas</strong> de Búzios, com{' '}
                    <strong>3 paradas para mergulho de até 20 minutos cada</strong>.
                  </p>
                  <ol className="relative space-y-5 pl-1">
                    {[
                      {
                        title: 'Saída do Píer da Rua das Pedras',
                        text: 'Embarque no coração de Búzios e início da navegação pela orla.',
                      },
                      {
                        title: '1ª parada — Praia de João Fernandes',
                        text: 'Primeiro mergulho em águas calmas e cristalinas.',
                      },
                      {
                        title: '2ª parada — Ilha Feia',
                        text: 'Snorkel e banho de mar ao redor da ilha.',
                      },
                      {
                        title: 'Última parada — Praia da Tartaruga',
                        text: 'Mergulho final antes do retorno ao píer.',
                      },
                    ].map((stop, i, arr) => (
                      <li key={stop.title} className="relative flex items-start gap-4">
                        <span className="relative flex flex-col items-center self-stretch">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-red-600)] text-white text-xs font-black shrink-0">
                            {i + 1}
                          </span>
                          {i < arr.length - 1 && (
                            <span
                              className="w-px flex-1 bg-[var(--color-charcoal-200)] mt-1 -mb-4"
                              aria-hidden
                            />
                          )}
                        </span>
                        <div className="pb-1">
                          <p className="font-sans text-sm sm:text-base font-bold text-[var(--color-charcoal-900)]">
                            {stop.title}
                          </p>
                          <p className="text-xs sm:text-sm text-[var(--color-charcoal-500)] leading-relaxed mt-0.5">
                            {stop.text}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-[var(--color-charcoal-100)]">
                    <RoteiroFact Icon={Waves} text="3 paradas de mergulho de até 20 min" />
                    <RoteiroFact Icon={Utensils} text="Bar a bordo: drinks, bebidas e churrasquinho" />
                    <RoteiroFact Icon={Anchor} text={`Embarcação para até ${tour.max_capacity ?? 120} pessoas`} />
                  </div>
                </div>

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
                    {/* Aviso de taxa de embarque por píer (pedido 12/ago) */}
                    <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-3 mt-3">
                      <Info size={15} className="text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-[var(--color-charcoal-700)] leading-relaxed">
                        Embarque padrão no <strong>Píer da Rua das Pedras, sem taxa</strong>.
                        {paidPiers.length > 0 && (
                          <>
                            {' '}Saindo de{' '}
                            {paidPiers
                              .map((p) => `${p.name} (${formatPierFeeShort(p.fee_cents)})`)
                              .join(' ou ')}
                            , a taxa de embarque é cobrada presencialmente, por pessoa.
                          </>
                        )}
                      </p>
                    </div>
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
                      analyticsListId="escuna-publica"
                    />
                  </div>
                </div>
              </aside>
            </div>
          </Container>
        </section>
        <LanchaUpsell />
        <PhotoGallery
          eyebrow="Galeria"
          title="A bordo da nossa escuna"
          subtitle="Fotos reais do passeio — escuna, ilhas, snorkel e os melhores momentos a bordo."
          photos={await getGalleryPhotos('galeria-escuna', PASSEIO_ESCUNA_GALLERY)}
        />
      </main>
      <Footer />
    </>
  );
}

function RoteiroFact({ Icon, text }: { Icon: typeof Waves; text: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-[var(--color-charcoal-50)] px-3.5 py-3">
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-[var(--color-red-600)] shrink-0">
        <Icon size={16} />
      </span>
      <p className="text-xs sm:text-[13px] font-semibold text-[var(--color-charcoal-700)] leading-snug">
        {text}
      </p>
    </div>
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
