type GtagFn = (
  command: 'event' | 'config' | 'js',
  ...args: unknown[]
) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

// Helper genérico — no-op se gtag não carregou (sem GA configurado).
export function trackEvent(
  name: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, params ?? {});
}

// Eventos canônicos do funil de conversão (nomes GA4 padrão).
export const analytics = {
  beginCheckout(scheduleId: string, valueBRL: number, passengers: number) {
    trackEvent('begin_checkout', {
      currency: 'BRL',
      value: valueBRL,
      items: [{ item_id: scheduleId, quantity: passengers }],
    });
  },
  purchase(bookingCode: string, valueBRL: number) {
    trackEvent('purchase', {
      transaction_id: bookingCode,
      currency: 'BRL',
      value: valueBRL,
    });
  },
  generateLead(source: string) {
    trackEvent('generate_lead', { source });
  },
  whatsappClick(location: string) {
    trackEvent('whatsapp_click', { location });
  },
};
