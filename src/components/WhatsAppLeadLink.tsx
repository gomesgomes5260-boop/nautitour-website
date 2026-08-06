'use client';

import { analytics } from '@/lib/analytics';

// Link de WhatsApp com tracking de lead — pra CTAs em server components
// (ex.: card "Outro horário?" da lancha). Dispara generate_lead no clique;
// o evento whatsapp_click + a conversão do Google Ads ficam a cargo do
// WhatsAppClickTracker global (listener em /api/wa). Navegação segue normal.
export default function WhatsAppLeadLink({
  href,
  source,
  className,
  children,
}: {
  href: string;
  source: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        analytics.generateLead(source);
      }}
    >
      {children}
    </a>
  );
}
