'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { buildWaUrl } from '@/lib/whatsapp';
import { analytics } from '@/lib/analytics';

const HIDDEN_PREFIXES = ['/admin', '/checkout', '/reserva'];
const DEFAULT_MESSAGE = 'Olá! Gostaria de saber mais sobre os passeios.';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.04 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.886 9.885zM20.52 3.449C18.24 1.245 15.24.044 12.045.044 5.463.044.104 5.402.101 11.987c0 2.096.547 4.142 1.588 5.945L0 24l6.184-1.62a11.93 11.93 0 0 0 5.71 1.454h.005c6.581 0 11.939-5.358 11.942-11.944 0-3.193-1.244-6.193-3.502-8.453z" />
    </svg>
  );
}

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
        href={buildWaUrl(DEFAULT_MESSAGE)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir conversa no WhatsApp"
        onMouseEnter={() => setShowTooltip(true)}
        onClick={() => analytics.whatsappClick('fab')}
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
