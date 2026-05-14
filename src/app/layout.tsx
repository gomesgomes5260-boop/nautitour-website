import type { Metadata } from "next";
import { Fraunces, Montserrat, JetBrains_Mono, Plus_Jakarta_Sans, Inter } from "next/font/google";
import WhatsAppFab from "@/components/WhatsAppFab";
import GoogleAnalytics from "@/components/GoogleAnalytics";
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

// Legacy aliases — mantém Plus_Jakarta_Sans e Inter como CSS vars
// pra que componentes que ainda referenciam --font-jakarta / --font-inter
// continuem renderizando enquanto a migração gradual acontece.
const jakartaLegacy = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const interLegacy = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
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
        className={`${fraunces.variable} ${montserrat.variable} ${jetbrainsMono.variable} ${jakartaLegacy.variable} ${interLegacy.variable}`}
      >
        {children}
        <WhatsAppFab />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
