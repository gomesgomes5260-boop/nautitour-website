'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import WhatsAppIcon from './WhatsAppIcon';

const HIDDEN_PREFIXES = ['/admin', '/checkout', '/reserva', '/blog/'];

export default function WhatsAppFab() {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowTooltip(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 flex items-center gap-3">
      <span
        className={`hidden sm:inline-block bg-[var(--color-charcoal-900)] text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-[var(--shadow-2)] transition-opacity duration-300 pointer-events-none ${
          showTooltip ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Fale com a gente
      </span>
      <a
        href="/api/wa?s=fab"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir conversa no WhatsApp"
        onMouseEnter={() => setShowTooltip(true)}
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebd5a] text-white shadow-[var(--shadow-3)] transition-transform hover:scale-105 active:scale-95"
      >
        <WhatsAppIcon className="w-7 h-7 relative z-10" />
        <span
          className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping motion-reduce:hidden"
          aria-hidden
        />
      </a>
    </div>
  );
}
