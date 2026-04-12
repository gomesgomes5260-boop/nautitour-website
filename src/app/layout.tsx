import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
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
      <body className={`${jakarta.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
