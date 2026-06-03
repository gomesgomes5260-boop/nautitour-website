import 'server-only';

/**
 * Client pro endpoint público do painel Nautitour (webreservas.xyz).
 *
 * Contrato em INTEGRATION_NAUTITOUR.md. Resumo:
 * - POST /api/public/bookings com X-API-Key e payload com qtd/preços
 * - Painel retorna { id, code, status, ticketUrl }
 * - id é usado como valor do QR de embarque (scanner do painel decodifica)
 * - code é o número da reserva exibido ao cliente (NTR-YYYYMMDD-NNN)
 * - skipCustomerNotifications=true porque este site já envia confirmação
 *
 * Sem retry agressivo: idempotência depende da nossa coluna
 * bookings.nautitour_booking_id. Quem chama precisa checar antes.
 *
 * Helpers puros (timezone, normalização de telefone) ficam em
 * `nautitour-utils.ts` pra serem testáveis sem mockar 'server-only'.
 */

export {
  buzziosTripDate,
  buzziosTripTime,
  normalizePhoneE164,
} from './nautitour-utils';

export type NautitourPaymentMethod =
  | 'PIX'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'CASH';

export type NautitourBookingInput = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  tripDate: string; // YYYY-MM-DD
  tripTime: string; // HH:MM
  fullPriceQty: number;
  halfPriceQty: number;
  fullPriceValue: number; // BRL (decimal)
  totalAmount: number; // BRL (decimal)
  paymentMethod?: NautitourPaymentMethod;
  paymentReference?: string;
  needsPickup?: boolean;
  pickupAddress?: string;
  pickupRoom?: string;
  notes?: string;
};

export type NautitourBookingResponse = {
  id: string;
  code: string;
  status: 'CONFIRMED';
  ticketUrl: string;
};

export class NautitourSyncError extends Error {
  constructor(
    message: string,
    public status?: number,
    public cause?: unknown,
  ) {
    super(message);
    this.name = 'NautitourSyncError';
  }
}

const TIMEOUT_MS = 10_000;

function getConfig() {
  const url = process.env.NAUTITOUR_API_URL;
  const key = process.env.NAUTITOUR_API_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ''), key };
}

export function isNautitourSyncEnabled(): boolean {
  return getConfig() !== null;
}

export async function registerNautitourBooking(
  input: NautitourBookingInput,
): Promise<NautitourBookingResponse> {
  const cfg = getConfig();
  if (!cfg) {
    throw new NautitourSyncError(
      'Nautitour panel sync disabled (missing NAUTITOUR_API_URL / NAUTITOUR_API_KEY)',
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${cfg.url}/api/public/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': cfg.key,
      },
      body: JSON.stringify({
        ...input,
        skipCustomerNotifications: true,
      }),
      signal: controller.signal,
    });

    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // fallthrough — handled abaixo
    }

    if (!res.ok) {
      const message =
        (body && typeof body === 'object' && 'error' in body
          ? String((body as { error: unknown }).error)
          : null) || `panel responded ${res.status}`;
      throw new NautitourSyncError(message, res.status, body);
    }

    if (
      !body ||
      typeof body !== 'object' ||
      !('id' in body) ||
      !('code' in body) ||
      !('ticketUrl' in body)
    ) {
      throw new NautitourSyncError(
        'malformed panel response (missing id/code/ticketUrl)',
        res.status,
        body,
      );
    }

    return body as NautitourBookingResponse;
  } catch (err) {
    if (err instanceof NautitourSyncError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new NautitourSyncError('panel request timed out after 10s', undefined, err);
    }
    throw new NautitourSyncError(
      err instanceof Error ? err.message : 'unknown panel error',
      undefined,
      err,
    );
  } finally {
    clearTimeout(timeout);
  }
}

