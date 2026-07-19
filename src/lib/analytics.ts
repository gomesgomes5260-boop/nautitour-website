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
  viewItem(itemId: string, itemName: string, valueBRL: number | null) {
    trackEvent('view_item', {
      currency: 'BRL',
      ...(valueBRL != null ? { value: valueBRL } : {}),
      items: [{ item_id: itemId, item_name: itemName }],
    });
  },
  selectItem(scheduleId: string, tourSlug: string, valueBRL: number | null) {
    trackEvent('select_item', {
      item_list_id: tourSlug,
      items: [
        { item_id: scheduleId, ...(valueBRL != null ? { price: valueBRL } : {}) },
      ],
    });
  },
  beginCheckout(scheduleId: string, valueBRL: number, passengers: number) {
    trackEvent('begin_checkout', {
      currency: 'BRL',
      value: valueBRL,
      items: [{ item_id: scheduleId, quantity: passengers }],
    });
  },
  addPaymentInfo(method: 'pix' | 'card', valueBRL: number) {
    trackEvent('add_payment_info', {
      currency: 'BRL',
      value: valueBRL,
      payment_type: method,
    });
  },
  purchase(bookingCode: string, valueBRL: number) {
    trackEvent('purchase', {
      transaction_id: bookingCode,
      currency: 'BRL',
      value: valueBRL,
    });
    // Conversão direta do Google Ads (além do import via GA4). Só dispara com
    // a tag AW configurada (GoogleAdsTag) + label da ação de conversão criada
    // no painel do Ads. No-op sem as envs.
    const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
    const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL;
    if (adsId && label) {
      trackEvent('conversion', {
        send_to: `${adsId}/${label}`,
        transaction_id: bookingCode,
        currency: 'BRL',
        value: valueBRL,
      });
    }
  },
  generateLead(source: string) {
    trackEvent('generate_lead', { source });
  },
  whatsappClick(location: string) {
    trackEvent('whatsapp_click', { location });
  },
};
