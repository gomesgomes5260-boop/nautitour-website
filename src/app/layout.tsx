import type { Metadata } from "next";
import { Fraunces, Montserrat, JetBrains_Mono, Plus_Jakarta_Sans, Inter } from "next/font/google";
import WhatsAppFab from "@/components/WhatsAppFab";
import "./globals.css";

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
  title: "Passeio de Barco e Escuna em Búzios | Nautitour Passeios",
  description: "Tenha uma experiência inesquecível com a Família e Amigos com a Nautitour Passeios. Passeio de Escuna e Lancha em Búzios.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        className={`${fraunces.variable} ${montserrat.variable} ${jetbrainsMono.variable} ${jakartaLegacy.variable} ${interLegacy.variable}`}
      >
        {children}
        <WhatsAppFab />
      </body>
    </html>
  );
}
