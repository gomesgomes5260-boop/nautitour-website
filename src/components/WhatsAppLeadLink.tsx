'use client';

import { analytics } from '@/lib/analytics';

// Link de WhatsApp com tracking de lead — pra CTAs em server components
// (ex.: card "Outro horário?" da lancha). Dispara generate_lead +
// whatsapp_click no clique; navegação segue normal.
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
        analytics.whatsappClick(source);
      }}
    >
      {children}
    </a>
  );
}
