import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Per-booking ownership token.
 *
 * When a booking is created, the checkout action sets an HttpOnly cookie
 * `booking_<code>` whose value is an HMAC of the booking_code. The payment
 * actions then require that cookie to authorize charge creation for the
 * booking. This prevents IDOR: knowing someone else's booking_code is no
 * longer enough to generate a payment order on their behalf.
 *
 * The HMAC key is derived from the service-role key — a server-only
 * secret with plenty of entropy. A dedicated BOOKING_SESSION_SECRET env
 * var takes precedence when set, so the secret can be rotated independent
 * of the Supabase key.
 */

function getSecret(): string {
  const s = process.env.BOOKING_SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) {
    throw new Error(
      'BOOKING_SESSION_SECRET (or SUPABASE_SERVICE_ROLE_KEY as fallback) must be set'
    );
  }
  return s;
}

export function signBookingCode(code: string): string {
  return createHmac('sha256', getSecret()).update(code).digest('base64url');
}

export function verifyBookingCode(code: string, signed: string | undefined): boolean {
  if (!signed) return false;
  let expected: string;
  try {
    expected = signBookingCode(code);
  } catch {
    return false;
  }
  const a = Buffer.from(expected);
  const b = Buffer.from(signed);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function cookieNameFor(code: string): string {
  // Booking codes are alphanumeric (gen_booking_code). Sanitize defensively
  // anyway so a malformed code can't escape into the cookie name.
  return `booking_${code.replace(/[^A-Za-z0-9_-]/g, '')}`;
}
