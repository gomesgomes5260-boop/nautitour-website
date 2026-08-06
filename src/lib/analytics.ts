type GtagFn = (
  command: 'event' | 'config' | 'js' | 'set',
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

// Dados do comprador pra Enhanced Conversions (Google Ads). Enviados via
// gtag('set', 'user_data', ...) — o próprio gtag normaliza e faz o hash
// SHA-256 client-side ANTES de transmitir, então PII crua nunca sai do
// browser. Só é chamado com consent de retargeting (ver PurchaseTracker).
export type PurchaseUserData = {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
};

// Normaliza telefone BR pra E.164 (+55DDNNNNNNNNN). Best-effort: descarta
// não-dígitos e assume Brasil quando não há código de país.
export function normalizePhoneE164(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return `+${digits}`;
}

// Monta o objeto user_data do gtag a partir dos dados do comprador. Retorna
// null se não sobrar nada utilizável. Pula e-mails placeholder `.invalid`
// (vendas de vendedor sem e-mail real — RFC 2606).
export function buildUserData(data?: PurchaseUserData): Record<string, unknown> | null {
  if (!data) return null;
  const out: Record<string, unknown> = {};

  const email = data.email?.trim().toLowerCase();
  if (email && email.includes('@') && !email.endsWith('.invalid')) {
    out.email = email;
  }

  const phone = normalizePhoneE164(data.phone);
  if (phone) out.phone_number = phone;

  const name = data.name?.trim();
  if (name) {
    const parts = name.split(/\s+/);
    out.address = {
      first_name: parts[0].toLowerCase(),
      ...(parts.length > 1
        ? { last_name: parts.slice(1).join(' ').toLowerCase() }
        : {}),
    };
  }

  return Object.keys(out).length > 0 ? out : null;
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
  purchase(
    bookingCode: string,
    valueBRL: number,
    userData?: PurchaseUserData
  ) {
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
      // Enhanced Conversions: alimenta o gtag com dados do comprador antes de
      // disparar a conversão — melhora o match rate (recupera conversões que o
      // cookie sozinho perderia). O gtag faz o hash SHA-256 client-side.
      const ud = buildUserData(userData);
      if (ud && typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('set', 'user_data', ud);
      }
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
    // Conversão do Google Ads de clique de WhatsApp — o foco de vendas do
    // negócio (a lancha fecha só por WhatsApp; equipe atende em rodízio). É uma
    // conversão de LEAD, SEM valor: contar o clique é o sinal, mas atribuir R$
    // seria receita fake que poluiria o valor de conversão / ROAS. A diferença
    // por origem vive no evento GA4 `whatsapp_click` (`location`), não aqui.
    // `transport_type: 'beacon'` garante que o hit sobreviva ao redirect do
    // /api/wa. No-op sem as envs. A ação de conversão no Ads deve ser criada
    // como "não usar valor" (count-only), coerente com isto.
    const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
    const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL;
    if (adsId && label) {
      trackEvent('conversion', {
        send_to: `${adsId}/${label}`,
        transport_type: 'beacon',
      });
    }
  },
};
