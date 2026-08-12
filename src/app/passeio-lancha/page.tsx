import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Star, Clock, Users, Check, MessageCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Container from '@/components/Container';
import DateScheduleSelector from '@/components/DateScheduleSelector';
import ViewItemTracker from '@/components/ViewItemTracker';
import WhatsAppLeadLink from '@/components/WhatsAppLeadLink';
import PhotoGallery from '@/components/PhotoGallery';
import TourJsonLd from '@/components/TourJsonLd';
import { PASSEIO_LANCHA_GALLERY } from '@/lib/photo-gallery';
import { getGalleryPhotos } from '@/lib/gallery';
import { createClient } from '@/lib/supabase/server';
import { formatDuration } from '@/lib/format-duration';

export const dynamic = 'force-dynamic';

// Foto real da lancha (bucket site-images) — usada no herói, no OG e no
// JSON-LD. Antes o herói caía num fallback de "cruzeiro" e o OG/JSON-LD
// usavam foto de escuna. O host do Supabase já está liberado em next.config.
const LANCHA_COVER =
  'https://hpinfkvfzezuizmeqsfm.supabase.co/storage/v1/object/public/site-images/misc/seq-0002-f334831e.webp';

export const metadata: Metadata = {
  title: 'Lancha Privativa em Búzios — passeio exclusivo até 12 pessoas',
  description:
    'Lancha privativa em Armação dos Búzios para grupos, eventos e ocasiões especiais. Roteiro sob medida — escolha a data e consulte a disponibilidade pelo WhatsApp.',
  alternates: { canonical: '/passeio-lancha' },
  openGraph: {
    title: 'Lancha Privativa em Búzios | Nautitour',
    description:
      'Passeio exclusivo de lancha privativa em Búzios. Grupos até 12 pessoas, roteiro flexível.',
    url: '/passeio-lancha',
    images: [LANCHA_COVER],
  },
};

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

// Rota interna que registra o clique (KPI do admin) e redireciona pro wa.me.
const WHATSAPP_URL = '/api/wa?s=lancha';

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
      <ViewItemTracker
        itemId="lancha-privativa"
        itemName={tour.name}
        valueBRL={tour.base_price_cents != null ? tour.base_price_cents / 100 : null}
      />
      <TourJsonLd
        name={tour.name}
        description={tour.description ?? 'Lancha privativa em Armação dos Búzios.'}
        imageUrl={tour.cover_image_url ?? LANCHA_COVER}
        priceCents={tour.base_price_cents}
        durationMinutes={tour.duration_minutes}
        maxCapacity={tour.max_capacity}
        url={`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nautitour-website.vercel.app'}/passeio-lancha`}
      />
      <main className="bg-[var(--color-charcoal-50)]">
        {/* === HERO === */}
        <section className="relative w-full overflow-hidden">
          {/* Foto deslocada pra direita: o texto cai sobre a parte escura do
              mar à esquerda (pedido 12/ago — saiu também o degradê vermelho). */}
          <Image
            src={tour.cover_image_url ?? LANCHA_COVER}
            alt={tour.name}
            fill
            className="object-cover"
            style={{ objectPosition: '72% center' }}
            priority
            sizes="100vw"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, rgba(31,31,31,0.85) 0%, rgba(31,31,31,0.5) 45%, rgba(31,31,31,0.08) 100%)',
            }}
          />
          <Container className="relative py-16 sm:py-20 md:py-24">
            <span className="inline-block text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-300)] mb-4">
              Privativo · Só vocês a bordo
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
            {/* CTA principal da página: a reserva da lancha fecha no WhatsApp */}
            <WhatsAppLeadLink
              href={WHATSAPP_URL}
              source="lancha-hero-whatsapp"
              className="inline-flex items-center gap-2.5 bg-[var(--color-success)] hover:brightness-110 text-white font-bold text-sm sm:text-base px-6 sm:px-7 py-3.5 rounded-full transition-all mt-6"
            >
              <MessageCircle size={18} />
              Consultar disponibilidade no WhatsApp
            </WhatsAppLeadLink>
          </Container>
        </section>

        {/* === MAIN — 2 cols === */}
        <section className="py-12 sm:py-16 md:py-20">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* === LEFT === */}
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
                      Sua lancha, seu roteiro.
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
                        value={`Até ${tour.max_capacity} pessoas`}
                      />
                    )}
                    <DetailItem
                      Icon={Star}
                      label="Exclusividade"
                      value="Só seu grupo a bordo"
                    />
                  </div>
                </div>
              </div>

              {/* === RIGHT: booking sticky card === */}
              <aside className="lg:col-span-5 lg:sticky lg:top-24 self-start">
                <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white overflow-hidden shadow-[var(--shadow-2)]">
                  <div className="p-5 sm:p-6 border-b border-[var(--color-charcoal-100)]">
                    <span className="inline-block text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-red-600)] bg-[var(--color-red-50)] px-2.5 py-1 rounded-full mb-2">
                      Privativo
                    </span>
                    <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-charcoal-500)] mb-0.5">
                      Preço fixo do barco
                    </p>
                    <p className="font-sans text-2xl sm:text-3xl font-black text-[var(--color-red-600)] leading-tight">
                      {formatPrice(tour.base_price_cents) ?? 'Sob consulta'}
                    </p>
                    <p className="text-xs sm:text-sm text-[var(--color-charcoal-500)] mt-1">
                      Consulta pelo WhatsApp — pagamento direto na loja
                    </p>
                  </div>
                  <div className="p-5 sm:p-6">
                    <h3 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-charcoal-700)] mb-4">
                      Escolha data e horário
                    </h3>
                    <p className="text-xs text-[var(--color-charcoal-500)] -mt-2 mb-4 leading-relaxed">
                      Escolha abaixo e fale com a equipe no WhatsApp pra
                      confirmar a disponibilidade — a reserva é finalizada com o
                      atendente, sem pagamento pelo site.
                    </p>
                    <DateScheduleSelector
                      schedules={schedulesNormalized}
                      fallbackPriceCents={tour.base_price_cents ?? null}
                      pricingMode="per_slot"
                      soldOutLabel="Reservado"
                      analyticsListId="lancha-privativa"
                      ctaMode="whatsapp"
                    />

                    {/* CTA de WhatsApp reforçado (pedido 12/ago) */}
                    <WhatsAppLeadLink
                      href={WHATSAPP_URL}
                      source="lancha-whatsapp"
                      className="mt-5 flex items-center justify-center gap-2.5 rounded-2xl bg-[var(--color-success)] hover:brightness-110 text-white font-bold text-sm py-4 px-4 transition-all"
                    >
                      <MessageCircle size={18} />
                      Falar no WhatsApp agora
                    </WhatsAppLeadLink>
                    <p className="text-[11px] text-[var(--color-charcoal-500)] text-center leading-relaxed mt-2">
                      Outro horário? Consulte a disponibilidade direto com a equipe.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </Container>
        </section>
        <PhotoGallery
          eyebrow="Galeria"
          title="Experiência privativa"
          subtitle="Imagens de roteiros privativos — ilhas, drone aéreo e momentos íntimos a bordo."
          photos={await getGalleryPhotos('galeria-lancha', PASSEIO_LANCHA_GALLERY)}
        />
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
