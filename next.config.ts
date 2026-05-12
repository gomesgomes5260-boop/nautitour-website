import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  // Anti-clickjacking. We don't embed the site in iframes anywhere.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop browsers from MIME-sniffing responses.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Don't leak the full URL when navigating to other origins.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Lock down legacy / sensitive browser features.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // HSTS: enforce HTTPS once the site is on a real domain (Vercel will serve
  // over HTTPS automatically; harmless on localhost since it's HTTP-only).
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'nautitour.com.br' },
    ],
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
