import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Rate limit IP-based via Upstash Redis.
// Em dev sem UPSTASH_REDIS_REST_URL retorna no-op (sempre permite).

type Limiter = {
  limit: (key: string) => Promise<{ success: boolean; remaining: number; reset: number }>;
};

const noopLimiter: Limiter = {
  async limit() {
    return { success: true, remaining: 999, reset: 0 };
  },
};

function buildRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function buildLimiter(
  redis: Redis | null,
  prefix: string,
  limit: number,
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`
): Limiter {
  if (!redis) {
    console.warn(`[rate-limit] UPSTASH_REDIS_* ausente — no-op para ${prefix}`);
    return noopLimiter;
  }
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `nautitour:${prefix}`,
    analytics: false,
  });
}

const redis = buildRedis();

export const bookingLimiter = buildLimiter(redis, 'booking', 5, '1 h');
export const inquiryLimiter = buildLimiter(redis, 'inquiry', 3, '1 h');
export const paymentLimiter = buildLimiter(redis, 'payment', 30, '1 h');
export const authLimiter = buildLimiter(redis, 'auth', 10, '15 m');
// Lead recapture: 10/min por IP. Best-effort — burst de tab-switching no
// checkout pode disparar várias capturas válidas, então limite mais permissivo.
export const leadCaptureLimiter = buildLimiter(redis, 'lead', 10, '1 m');

/**
 * Extrai IP do cliente lendo `x-forwarded-for` (primeiro IP), fallback
 * `x-real-ip`, depois 'unknown'. Vercel popula `x-forwarded-for`
 * corretamente.
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}
