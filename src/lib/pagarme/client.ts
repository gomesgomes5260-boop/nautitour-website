import { getApiKey, getApiUrl } from './config';

/**
 * Minimal Pagar.me v5 API client.
 *
 * Auth is HTTP Basic with the secret key as the username (blank password).
 * We never log the API key or any field that could contain card data
 * (number, cvv) — Pagar.me returns only last4 / brand which are safe.
 */

export type PagarmeOrder = {
  id: string;
  code?: string;
  status: string;
  amount: number;
  currency: string;
  customer?: { id: string; email?: string };
  charges?: PagarmeCharge[];
  metadata?: Record<string, string>;
};

export type PagarmeCharge = {
  id: string;
  status: string;
  amount: number;
  payment_method: 'pix' | 'credit_card' | 'boleto';
  paid_at?: string | null;
  last_transaction?: {
    qr_code?: string;
    qr_code_url?: string;
    expires_at?: string;
    status?: string;
  };
};

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  idempotencyKey?: string;
};

async function pagarmeFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${getApiUrl()}${path}`;
  const auth = Buffer.from(`${getApiKey()}:`).toString('base64');
  const headers: Record<string, string> = {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;

  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const errMsg =
      (json && typeof json === 'object' && 'message' in json && (json as { message?: string }).message) ||
      `Pagar.me request failed (${res.status})`;
    throw new Error(String(errMsg));
  }
  return json as T;
}

export type CreatePixOrderInput = {
  bookingId: string;
  bookingCode: string;
  amountCents: number;
  description: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    document?: string;
  };
  expiresInSeconds?: number; // default 3600 (1h)
};

/**
 * Create a Pagar.me order with a single PIX charge.
 * Uses the booking_id as both `code` and Idempotency-Key, so retries with
 * the same booking won't create duplicate orders.
 */
export function createPixOrder(input: CreatePixOrderInput): Promise<PagarmeOrder> {
  // Document is optional in Pagar.me but required for some flows. Strip
  // non-digits if present.
  const document = input.customer.document?.replace(/\D/g, '') || undefined;

  const body = {
    code: input.bookingCode,
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      phones: input.customer.phone
        ? {
            mobile_phone: parsePhone(input.customer.phone),
          }
        : undefined,
      document,
      document_type: document ? (document.length === 11 ? 'CPF' : 'CNPJ') : undefined,
      type: document && document.length === 14 ? 'company' : 'individual',
    },
    items: [
      {
        amount: input.amountCents,
        description: input.description,
        quantity: 1,
        code: input.bookingCode,
      },
    ],
    payments: [
      {
        payment_method: 'pix',
        pix: {
          expires_in: input.expiresInSeconds ?? 3600,
        },
      },
    ],
    metadata: {
      booking_id: input.bookingId,
      booking_code: input.bookingCode,
    },
  };

  return pagarmeFetch<PagarmeOrder>('/orders', {
    method: 'POST',
    body,
    idempotencyKey: `booking-${input.bookingId}`,
  });
}

export function getOrder(id: string): Promise<PagarmeOrder> {
  return pagarmeFetch<PagarmeOrder>(`/orders/${id}`);
}

/**
 * Best-effort parse of a Brazilian phone string (e.g. "(22) 99999-9999")
 * into Pagar.me's expected shape. If digits don't fit the BR mobile mold
 * we still send what we have — Pagar.me will validate and reject if so.
 */
function parsePhone(raw: string) {
  const digits = raw.replace(/\D/g, '');
  // Strip country code if present
  const local = digits.length > 11 ? digits.slice(-11) : digits;
  return {
    country_code: '55',
    area_code: local.slice(0, 2),
    number: local.slice(2),
  };
}
