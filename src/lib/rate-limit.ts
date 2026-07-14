import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import * as Sentry from '@sentry/nextjs';

// Rate limit IP-based via Upstash Redis.
// Em dev sem UPSTASH_REDIS_REST_URL retorna no-op (sempre permite).
// Decisão (13/jul): fail-open MAS com alerta no Sentry se rodar sem
// proteção em produção — visibilidade sem travar o fluxo.

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
    const msg = `[rate-limit] UPSTASH_REDIS_* ausente — no-op para ${prefix}`;
    console.warn(msg);
    // Em produção, rodar sem rate limit é um risco silencioso: sinaliza no
    // Sentry (fail-open observável). Em dev/preview segue só o warn.
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureMessage(
        `Rate limit desativado em produção (Upstash ausente) — limiter "${prefix}"`,
        'warning'
      );
    }
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
 * `x-real-ip`, depois 'unknown'. Pressuposto: a app roda sempre atrás do
 * proxy da Vercel, que popula `x-forwarded-for` com o IP real do cliente
 * na primeira posição. Fora desse proxy o valor é client-controlado.
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

/**
 * Rate limit dos fluxos de autenticação por IP **e** por conta.
 * Dois checks no `authLimiter`: um com a chave do IP e outro com `ip:email`
 * — o segundo contém brute-force/credential-stuffing distribuído (vários
 * IPs) contra uma única conta. Basta um dos dois estourar pra bloquear.
 * `success:false` → o caller devolve a mensagem genérica de "muitas
 * tentativas". Email vazio cai só no check de IP.
 */
export async function checkAuthRateLimit(
  ip: string,
  email?: string | null
): Promise<boolean> {
  const byIp = await authLimiter.limit(`ip:${ip}`);
  if (!byIp.success) return false;
  const normalized = email?.trim().toLowerCase();
  if (normalized) {
    const byAccount = await authLimiter.limit(`ip:${ip}:acct:${normalized}`);
    if (!byAccount.success) return false;
  }
  return true;
}
