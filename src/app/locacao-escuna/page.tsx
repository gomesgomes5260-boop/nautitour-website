import { notFound } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import InquiryForm from './InquiryForm';
import PhotoGallery from '@/components/PhotoGallery';
import { LOCACAO_ESCUNA_GALLERY } from '@/lib/photo-gallery';

export const dynamic = 'force-dynamic';

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
                  src={tour.cover_image_url ?? '/images/photos/escuna/escuna-pier-01.jpg'}
                  alt={tour.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {highlights.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(9, 110, 171)' }}>
                    O que oferecemos
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

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-2">Como funciona</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>Você preenche os dados do passeio que pretende fazer.</li>
                  <li>Salvamos a solicitação e abrimos o WhatsApp com seus dados.</li>
                  <li>
                    Um representante envia o orçamento personalizado e fecha o pacote
                    diretamente com você.
                  </li>
                </ol>
              </div>
            </div>

            <div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(9, 110, 171)' }}>
                  Solicitar orçamento
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Preencha os dados do seu passeio. Mínimo de 3 horas, até{' '}
                  {tour.max_capacity ?? 120} pessoas.
                </p>
                <InquiryForm />
              </div>
            </div>
          </div>
        </section>
        <PhotoGallery
          eyebrow="Galeria"
          title="Seu evento, sua escuna"
          subtitle="Festas, confraternizações e celebrações — espaço completo com bar a bordo."
          photos={LOCACAO_ESCUNA_GALLERY}
        />
      </main>
      <Footer />
    </>
  );
}
