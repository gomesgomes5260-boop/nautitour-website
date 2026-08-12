import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Check, Gift, Music, Users, Briefcase } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Container from '@/components/Container';
import InquiryForm from './InquiryForm';
import PhotoGallery from '@/components/PhotoGallery';
import { LOCACAO_ESCUNA_GALLERY } from '@/lib/photo-gallery';
import { getGalleryPhotos } from '@/lib/gallery';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const LOCACAO_COVER = '/images/photos/escuna/escuna-pier-02.jpg';

export const metadata: Metadata = {
  title: 'Locação Privativa da Escuna em Búzios — eventos até 120 pessoas',
  description:
    'Locação exclusiva da escuna em Armação dos Búzios para grupos, festas e eventos. Roteiro sob medida, estrutura completa com bar a bordo — orçamento pelo WhatsApp.',
  alternates: { canonical: '/locacao-escuna' },
  openGraph: {
    title: 'Locação Privativa da Escuna | Nautitour',
    description:
      'A escuna inteira pro seu grupo: festas, confraternizações e eventos em Búzios, até 120 pessoas.',
    url: '/locacao-escuna',
    images: [LOCACAO_COVER],
  },
};

// Redesenho 12/ago ("página muito sem graça"): hero full-bleed + ocasiões +
// passos visuais + form sticky. A LÓGICA do InquiryForm ficou intocada.

const OCCASIONS = [
  {
    Icon: Gift,
    title: 'Aniversários',
    text: 'Comemore em alto mar com quem você gosta, do jeito que quiser.',
  },
  {
    Icon: Music,
    title: 'Despedidas e festas',
    text: 'Despedida de solteiro(a), formatura ou aquela festa que precisa ser inesquecível.',
  },
  {
    Icon: Users,
    title: 'Confraternizações',
    text: 'Família, amigos ou o grupo todo reunido num passeio exclusivo.',
  },
  {
    Icon: Briefcase,
    title: 'Eventos corporativos',
    text: 'Team building, premiações e recepção de clientes com vista pra Búzios.',
  },
];

const STEPS = [
  'Você preenche os dados do passeio que pretende fazer.',
  'Salvamos a solicitação e abrimos o WhatsApp com seus dados.',
  'Um representante envia o orçamento personalizado e fecha o pacote diretamente com você.',
];

export default async function LocacaoEscunaPage() {
  const supabase = await createClient();

  const { data: tour, error } = await supabase
    .from('tours')
    .select('*')
    .eq('slug', 'locacao-escuna')
    .eq('active', true)
    .maybeSingle();

  if (error) throw error;
  if (!tour) notFound();

  const highlights = Array.isArray(tour.highlights)
    ? (tour.highlights as string[])
    : [];

  return (
    <>
      <Header />
      <main className="bg-[var(--color-charcoal-50)]">
        {/* === HERO === */}
        <section className="relative w-full overflow-hidden">
          <Image
            src={tour.cover_image_url ?? LOCACAO_COVER}
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
                'linear-gradient(105deg, rgba(31,31,31,0.85) 0%, rgba(31,31,31,0.5) 55%, rgba(31,31,31,0.15) 100%)',
            }}
          />
          <Container className="relative py-16 sm:py-20 md:py-24">
            <span className="inline-block text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-300)] mb-4">
              Evento privado · Búzios
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
            <p className="text-white/85 text-sm sm:text-base md:text-lg leading-relaxed mt-4 max-w-2xl">
              {tour.description ??
                'A escuna inteira pro seu grupo: festas, confraternizações e eventos com estrutura completa e bar a bordo.'}
            </p>
          </Container>
        </section>

        {/* === MAIN — 2 cols === */}
        <section className="py-12 sm:py-16 md:py-20">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* === LEFT === */}
              <div className="lg:col-span-7 space-y-6">
                {/* Ocasiões */}
                <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-8">
                  <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)]">
                    Ocasiões
                  </span>
                  <h2
                    className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mt-2 mb-5"
                    style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', lineHeight: '1.15' }}
                  >
                    A escuna inteira, do seu jeito.
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {OCCASIONS.map((occ) => (
                      <div
                        key={occ.title}
                        className="rounded-xl bg-[var(--color-charcoal-50)] p-4 sm:p-5"
                      >
                        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-[var(--color-red-600)] mb-3">
                          <occ.Icon size={18} />
                        </span>
                        <p className="font-sans text-sm sm:text-base font-bold text-[var(--color-charcoal-900)] mb-1">
                          {occ.title}
                        </p>
                        <p className="text-xs sm:text-sm text-[var(--color-charcoal-500)] leading-relaxed">
                          {occ.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* O que oferecemos */}
                {highlights.length > 0 && (
                  <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-8">
                    <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)]">
                      O que oferecemos
                    </span>
                    <h2
                      className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mt-2 mb-5"
                      style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', lineHeight: '1.15' }}
                    >
                      Estrutura completa a bordo.
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

                {/* Como funciona */}
                <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-8">
                  <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)]">
                    Como funciona
                  </span>
                  <h2
                    className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight mt-2 mb-5"
                    style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', lineHeight: '1.15' }}
                  >
                    Do pedido ao embarque, em 3 passos.
                  </h2>
                  <ol className="space-y-5">
                    {STEPS.map((step, i, arr) => (
                      <li key={step} className="relative flex items-start gap-4">
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
                        <p className="text-sm sm:text-base text-[var(--color-charcoal-700)] leading-relaxed pt-1.5 pb-1">
                          {step}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* === RIGHT: form sticky === */}
              <aside className="lg:col-span-5 lg:sticky lg:top-24 self-start">
                <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white overflow-hidden shadow-[var(--shadow-2)]">
                  <div className="p-5 sm:p-6 border-b border-[var(--color-charcoal-100)]">
                    <span className="inline-block text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--color-red-600)] bg-[var(--color-red-50)] px-2.5 py-1 rounded-full mb-2">
                      Orçamento sem compromisso
                    </span>
                    <h2 className="font-display text-xl sm:text-2xl font-semibold text-[var(--color-charcoal-900)] tracking-tight">
                      Solicitar orçamento
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--color-charcoal-500)] mt-1">
                      Preencha os dados do seu passeio. Mínimo de 3 horas, até{' '}
                      {tour.max_capacity ?? 120} pessoas.
                    </p>
                  </div>
                  <div className="p-5 sm:p-6">
                    <InquiryForm />
                  </div>
                </div>
              </aside>
            </div>
          </Container>
        </section>
        <PhotoGallery
          eyebrow="Galeria"
          title="Seu evento, sua escuna"
          subtitle="Festas, confraternizações e celebrações — espaço completo com bar a bordo."
          photos={await getGalleryPhotos('galeria-locacao', LOCACAO_ESCUNA_GALLERY)}
        />
      </main>
      <Footer />
    </>
  );
}
