import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowToBook from "@/components/HowToBook";
import WhyChooseUs from "@/components/WhyChooseUs";
import CTASection from "@/components/CTASection";
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
        <CTASection />
        <MapSection />
      </main>
      <Footer />
    </>
  );
}
