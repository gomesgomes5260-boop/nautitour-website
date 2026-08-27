import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowToBook from "@/components/HowToBook";
import WhyChooseUs from "@/components/WhyChooseUs";
import CTASection from "@/components/CTASection";
import PhotoGallery from "@/components/PhotoGallery";
import { HOME_GALLERY } from "@/lib/photo-gallery";
import { getGalleryPhotos } from "@/lib/gallery";
import { MapSection } from "@/components/Footer";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { localBusinessJsonLd } from "@/lib/site-jsonld";

// Galeria vem do banco (tag galeria-home) — editável em /admin/imagens.
export const dynamic = "force-dynamic";

export default async function Home() {
  const galleryPhotos = await getGalleryPhotos("galeria-home", HOME_GALLERY);
  return (
    <>
      <JsonLd data={localBusinessJsonLd()} />
      <Header />
      <main>
        <HeroSection />
        <HowToBook />
        <WhyChooseUs />
        <PhotoGallery
          eyebrow="Galeria"
          title="O que você vai viver"
          subtitle="Momentos reais a bordo da escuna e nas ilhas paradisíacas de Búzios."
          photos={galleryPhotos}
        />
        <CTASection />
        <MapSection />
      </main>
      <Footer />
    </>
  );
}
