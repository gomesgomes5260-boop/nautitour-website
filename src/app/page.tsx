import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowToBook from "@/components/HowToBook";
import WhyChooseUs from "@/components/WhyChooseUs";
import CTASection from "@/components/CTASection";
import PhotoGallery from "@/components/PhotoGallery";
import { HOME_GALLERY } from "@/lib/photo-gallery";
import { MapSection } from "@/components/Footer";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <HowToBook />
        <WhyChooseUs />
        <PhotoGallery
          eyebrow="Galeria"
          title="O que você vai viver"
          subtitle="Momentos reais a bordo da escuna e nas ilhas paradisíacas de Búzios."
          photos={HOME_GALLERY}
        />
        <CTASection />
        <MapSection />
      </main>
      <Footer />
    </>
  );
}
