import type { Metadata } from "next";
import { Fraunces, Montserrat, JetBrains_Mono } from "next/font/google";
import WhatsAppFab from "@/components/WhatsAppFab";
import WhatsAppClickTracker from "@/components/WhatsAppClickTracker";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import GoogleAdsTag from "@/components/GoogleAdsTag";
import MetaPixel from "@/components/MetaPixel";
import CookieBanner from "@/components/CookieBanner";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nautitour-website.vercel.app";

// Fonts oficiais do Brand Guide (design/brand-guide/type/):
// - Fraunces (display, h1-h6) — opsz variável 9-144, peso 300-900
// - Montserrat (body) — heavy pra wordmark, regular pra leitura
// - JetBrains Mono — booking codes, recibos, dados monoespaçados
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Passeio de Barco e Escuna em Búzios | Nautitour Passeios",
    template: "%s | Nautitour Passeios",
  },
  description:
    "Tenha uma experiência inesquecível com família e amigos. Passeio de escuna e lancha privativa em Armação dos Búzios — reserva online com Pix ou cartão.",
  keywords: [
    "passeio de barco Búzios",
    "passeio de escuna Búzios",
    "lancha privativa Búzios",
    "Armação dos Búzios",
    "turismo Búzios",
    "Nautitour",
  ],
  authors: [{ name: "Nautitour Passeios" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Nautitour Passeios",
    title: "Passeio de Barco e Escuna em Búzios | Nautitour Passeios",
    description:
      "Reserve online seu passeio de escuna ou lancha privativa em Armação dos Búzios. Pix ou cartão, confirmação imediata.",
    images: [
      {
        url: "/images/photos/escuna/escuna-pier-01.jpg",
        width: 1200,
        height: 630,
        alt: "Escuna da Nautitour navegando em Búzios",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Passeio de Barco e Escuna em Búzios | Nautitour Passeios",
    description:
      "Reserve online seu passeio de escuna ou lancha privativa em Armação dos Búzios.",
    images: ["/images/photos/escuna/escuna-pier-01.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        className={`${fraunces.variable} ${montserrat.variable} ${jetbrainsMono.variable}`}
      >
        {children}
        <WhatsAppFab />
        <WhatsAppClickTracker />
        <CookieBanner />
        <GoogleAnalytics />
        <GoogleAdsTag />
        <MetaPixel />
      </body>
    </html>
  );
}
