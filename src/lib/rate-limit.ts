import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import * as Sentry from '@sentry/nextjs';
import { createAdminClient } from '@/lib/supabase/admin';

// Rate limit IP-based com dois backends:
//   1. Upstash Redis (preferencial) — se UPSTASH_REDIS_REST_* estiverem setadas.
//   2. Postgres/Supabase (padrão desde 18/jul) — RPC `rate_limit_check`
//      (migration 034, fixed window) via service role. Zero serviço externo;
//      com o banco em sa-east-1 o roundtrip é desprezível.
// Sem NENHUM backend (dev local sem service key): no-op.
// Decisão (13/jul): fail-open MAS com alerta no Sentry se rodar sem
// proteção em produção — visibilidade sem travar o fluxo. Vale também pra
// erro de RUNTIME de qualquer backend (18/jul: Upstash deletado derrubou
// o login porque o throw não era capturado).

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

const WINDOW_UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 } as const;

type Window = `${number} ${'s' | 'm' | 'h' | 'd'}`;

function windowToSeconds(window: Window): number {
  const [amount, unit] = window.split(' ') as [string, keyof typeof WINDOW_UNIT_SECONDS];
  return Number(amount) * WINDOW_UNIT_SECONDS[unit];
}

function failOpen(prefix: string, err: unknown) {
  console.error(`[rate-limit] falha no backend (${prefix}) — fail-open`, err);
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(err, {
      tags: { module: 'rate-limit', limiter: prefix },
    });
  }
  return { success: true, remaining: 999, reset: 0 };
}

/** Fixed window no Postgres via RPC `rate_limit_check` (migration 034). */
function buildPostgresLimiter(prefix: string, limit: number, window: Window): Limiter {
  const windowSeconds = windowToSeconds(window);
  return {
    async limit(key: string) {
      try {
        const supabase = createAdminClient();
        const { data, error } = await supabase.rpc('rate_limit_check', {
          p_key: `${prefix}:${key}`,
          p_limit: limit,
          p_window_seconds: windowSeconds,
        });
        if (error) throw error;
        return { success: data === true, remaining: 0, reset: 0 };
      } catch (err) {
        return failOpen(prefix, err);
      }
    },
  };
}

function buildLimiter(
  redis: Redis | null,
  prefix: string,
  limit: number,
  window: Window
): Limiter {
  if (!redis) {
    // Sem Upstash, o Postgres assume — desde que a service key exista
    // (em produção sempre existe; dev local sem ela cai no no-op).
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return buildPostgresLimiter(prefix, limit, window);
    }
    const msg = `[rate-limit] nenhum backend disponível — no-op para ${prefix}`;
    console.warn(msg);
    // Em produção, rodar sem rate limit é um risco silencioso: sinaliza no
    // Sentry (fail-open observável). Em dev/preview segue só o warn.
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureMessage(
        `Rate limit desativado em produção (sem Upstash e sem service key) — limiter "${prefix}"`,
        'warning'
      );
    }
    return noopLimiter;
  }
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `nautitour:${prefix}`,
    analytics: false,
  });
  // Fail-open também em erro de RUNTIME (Redis fora do ar, DNS morto, token
  // inválido): sem isso, um Upstash deletado derruba login/checkout inteiros
  // — aconteceu em produção em 18/jul (ENOTFOUND após migração). Mesma
  // decisão de 13/jul: nunca travar o fluxo, mas alertar no Sentry.
  return {
    async limit(key: string) {
      try {
        return await ratelimit.limit(key);
      } catch (err) {
        return failOpen(prefix, err);
      }
    },
  };
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
