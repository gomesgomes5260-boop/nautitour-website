import { createHash } from 'crypto';
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
    // Campos de recusa de cartão — populados quando a adquirente (Stone)
    // nega a autorização. Usados pra explicar o motivo real ao cliente.
    acquirer_message?: string | null;
    acquirer_return_code?: string | null;
    gateway_response?: {
      code?: string;
      errors?: Array<{ message?: string }> | null;
    } | null;
  };
};

/**
 * Endereço de cobrança do cartão. Obrigatório pela antifraude da Stone: um
 * pedido de cartão sem `billing_address` é recusado na validação com
 * `validation_error | billing | "value" is required` — antes mesmo de tentar
 * autorizar. Como usamos card_token, o endereço NÃO é tokenizado e precisa
 * viajar no pedido (docs Pagar.me v5).
 */
export type BillingAddress = {
  line_1: string;
  line_2?: string;
  zip_code: string; // só dígitos, 8
  city: string;
  state: string; // UF, 2 chars
  country: string; // ISO-2, ex 'BR'
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
    throw new Error(extractPagarmeError(json, res.status));
  }
  return json as T;
}

/**
 * Extrai uma mensagem legível do corpo de erro da Pagar.me. Respostas de
 * validação vêm como `{ message, errors: { "campo": ["motivo"] } }` — o
 * `message` sozinho ("The request is invalid.") não diz nada, então
 * anexamos o primeiro detalhe de `errors` (ex: `billing: "value" is
 * required`). Nunca inclui dado de cartão (a Pagar.me não ecoa PAN/CVV).
 */
export function extractPagarmeError(json: unknown, status: number): string {
  if (!json || typeof json !== 'object') {
    return `Pagar.me request failed (${status})`;
  }
  const obj = json as { message?: string; errors?: unknown };
  const base = obj.message || `Pagar.me request failed (${status})`;
  const detail = firstErrorDetail(obj.errors);
  return detail ? `${base} | ${detail}` : base;
}

function firstErrorDetail(errors: unknown): string | null {
  if (!errors) return null;
  // Formato objeto: { "campo": ["motivo", ...] }
  if (!Array.isArray(errors) && typeof errors === 'object') {
    for (const [field, msgs] of Object.entries(errors as Record<string, unknown>)) {
      const msg = Array.isArray(msgs) ? msgs[0] : msgs;
      if (msg) return `${field}: ${String(msg)}`;
    }
    return null;
  }
  // Formato array: [{ message }, ...]
  if (Array.isArray(errors)) {
    const first = errors[0] as { message?: string } | string | undefined;
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && first.message) return first.message;
  }
  return null;
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
 * Traduz o motivo bruto de uma recusa de cartão (mensagem da adquirente)
 * numa frase curta em PT-BR que o cliente entende. Cai num fallback genérico
 * quando não reconhece a mensagem. Retorna também `raw` pra log interno.
 */
export function describeCardDecline(charge: PagarmeCharge | undefined): {
  friendly: string;
  raw: string | null;
} {
  const tx = charge?.last_transaction;
  const raw =
    tx?.acquirer_message ||
    tx?.gateway_response?.errors?.[0]?.message ||
    null;
  const code = tx?.acquirer_return_code || tx?.gateway_response?.code || null;
  const hay = `${raw ?? ''} ${code ?? ''}`.toLowerCase();

  let friendly = 'Não foi possível aprovar o cartão.';
  if (/insufficient|saldo|limite|funds/.test(hay)) {
    friendly = 'Cartão recusado por saldo/limite insuficiente.';
  } else if (/cvv|security code|cvc|expired|vencid|validade|invalid card|dados inv/.test(hay)) {
    friendly = 'Dados do cartão incorretos ou cartão vencido. Confira número, validade e CVV.';
  } else if (/fraud|antifraud|risk|blocked|bloque/.test(hay)) {
    friendly = 'Compra bloqueada pelo emissor do cartão por segurança.';
  } else if (/do not honor|honor|nao autoriz|não autoriz|declined|recus/.test(hay)) {
    friendly = 'Compra não autorizada pelo banco emissor.';
  }
  return { friendly, raw };
}

export type CreateCardOrderInput = {
  bookingId: string;
  bookingCode: string;
  amountCents: number;
  description: string;
  cardToken: string; // generated client-side via /tokens
  installments?: number; // default 1
  customer: {
    name: string;
    email: string;
    phone?: string;
    document?: string;
  };
  // Endereço de cobrança — obrigatório pela antifraude da Stone.
  billingAddress: BillingAddress;
  // Up to 13 chars; appears on the card statement.
  statementDescriptor?: string;
};

/**
 * Create a Pagar.me order with a single credit-card charge using a tokenized
 * card. PAN/CVV never reach the server — only the opaque `card_token`.
 *
 * Card orders are typically synchronous: the response status will be `paid`
 * on approval or `failed` otherwise. The webhook still fires (and is
 * idempotent) for any post-authorization events (refunds, chargebacks).
 */
export function createCreditCardOrder(input: CreateCardOrderInput): Promise<PagarmeOrder> {
  const document = input.customer.document?.replace(/\D/g, '') || undefined;
  const installments = Math.max(1, Math.min(input.installments ?? 1, 12));

  const body = {
    code: input.bookingCode,
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      phones: input.customer.phone
        ? { mobile_phone: parsePhone(input.customer.phone) }
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
        payment_method: 'credit_card',
        credit_card: {
          card_token: input.cardToken,
          installments,
          statement_descriptor: (input.statementDescriptor ?? 'NAUTITOUR').slice(0, 13),
          // billing_address viaja no pedido (não é tokenizado). Sem isso a
          // Stone recusa na validação.
          card: {
            billing_address: {
              line_1: input.billingAddress.line_1,
              line_2: input.billingAddress.line_2 || undefined,
              zip_code: input.billingAddress.zip_code,
              city: input.billingAddress.city,
              state: input.billingAddress.state,
              country: input.billingAddress.country,
            },
          },
        },
      },
    ],
    metadata: {
      booking_id: input.bookingId,
      booking_code: input.bookingCode,
    },
  };

  // Pagar.me caches responses by Idempotency-Key. If we used a stable
  // suffix like `-card`, a first attempt that failed (wrong CVV, declined,
  // etc.) would lock the booking out — any later try with a different
  // card would just replay the cached failure. Include a hash of the card
  // token so each new card gets a fresh slot.
  const tokenFingerprint = createHash('sha256')
    .update(input.cardToken)
    .digest('hex')
    .slice(0, 12);

  return pagarmeFetch<PagarmeOrder>('/orders', {
    method: 'POST',
    body,
    idempotencyKey: `booking-${input.bookingId}-card-${tokenFingerprint}`,
  });
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

export type RefundChargeResult =
  | { ok: true; charge: PagarmeCharge; raw: unknown }
  | { ok: false; error: string; raw: unknown };

/**
 * Refund a Pagar.me v5 charge — total by default, partial if amountCents
 * is provided. Pagar.me also returns 200 when the charge is already
 * refunded; we treat that as success.
 */
export async function refundCharge(
  chargeId: string,
  amountCents?: number
): Promise<RefundChargeResult> {
  if (!chargeId) {
    return { ok: false, error: 'charge_id ausente', raw: null };
  }
  try {
    const body: Record<string, unknown> = {};
    if (amountCents !== undefined) body.amount = amountCents;
    const data = await pagarmeFetch<PagarmeCharge>(
      `/charges/${encodeURIComponent(chargeId)}`,
      { method: 'DELETE', body }
    );
    return { ok: true, charge: data, raw: data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      raw: null,
    };
  }
}
