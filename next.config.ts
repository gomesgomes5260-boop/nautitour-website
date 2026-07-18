import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// CSP em report-only por enquanto: navegadores apenas logam violations
// no console (não há endpoint configurado) — ajustamos a policy conforme
// novos serviços aparecem, depois migramos pra enforce (Content-Security-Policy).
const cspReportOnly = [
  "default-src 'self'",
  // 'unsafe-inline' / 'unsafe-eval' necessários por hidratação inline do Next
  // e SDKs (sem nonce SSR). Turnstile carrega challenges.cloudflare.com.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  // Tailwind v4 e next/font usam inline styles.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  // images: photos locais + Supabase storage + Vercel preview + data/blob.
  "img-src 'self' data: blob: https:",
  // fetch: tokenize Pagar.me + Supabase (REST e Realtime WSS).
  "connect-src 'self' https://api.pagar.me https://*.supabase.co wss://*.supabase.co",
  // Turnstile renderiza um iframe pra captcha.
  "frame-src 'self' https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Versão moderna de X-Frame-Options: DENY (mantido em paralelo por compat).
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  // Anti-clickjacking. We don't embed the site in iframes anywhere.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop browsers from MIME-sniffing responses.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Don't leak the full URL when navigating to other origins.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Lock down legacy / sensitive browser features.
  // camera=(self) libera a câmera pro scanner de check-in em /admin/scan
  // (html5-qrcode); demais features seguem bloqueadas.
  {
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(), geolocation=(), interest-cohort=()',
  },
  // HSTS: enforce HTTPS once the site is on a real domain. 2-year max-age,
  // includeSubDomains and preload satisfy the hstspreload.org submission
  // criteria. Vercel serves over HTTPS automatically; harmless on localhost
  // since the browser ignores HSTS on plain HTTP.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Content Security Policy em report-only: observa violations sem bloquear
  // requests. Quando estiver estável, trocar a chave por 'Content-Security-Policy'.
  {
    key: 'Content-Security-Policy-Report-Only',
    value: cspReportOnly,
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'nautitour.com.br' },
      // Supabase Storage (buckets blog-images e site-images) via next/image.
      // Projeto atual: Nautitour BR (sa-east-1).
      { protocol: 'https', hostname: 'hpinfkvfzezuizmeqsfm.supabase.co' },
      // Projeto antigo (us-west-2), mantido durante a janela de rollback da
      // migração de região — remover após aposentar o projeto Nutitour.
      { protocol: 'https', hostname: 'uydvnjcqrfjacwburvuo.supabase.co' },
    ],
  },
  experimental: {
    serverActions: {
      // Uploads de imagem via server action (blog + biblioteca /admin/imagens).
      // O browser comprime antes de enviar; 25mb cobre o fallback de original.
      bodySizeLimit: '25mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Build-time só — sem token, upload de source maps é skipped silenciosamente.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Proxy requests do client SDK pelo próprio domínio — evita adblockers e
  // simplifica CSP (não precisa allowlist `*.ingest.sentry.io`).
  tunnelRoute: '/monitoring',
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
