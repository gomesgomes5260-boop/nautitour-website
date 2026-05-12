'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <html>
      <body>
        <main className="bg-white min-h-screen flex items-center justify-center">
          <section className="px-8 py-24 max-w-2xl mx-auto text-center">
            <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">
              Erro
            </p>
            <h1
              className="text-3xl font-normal mb-4"
              style={{ color: 'rgb(219, 56, 44)' }}
            >
              Algo deu errado
            </h1>
            <p className="text-gray-700 mb-6">
              Tivemos um problema inesperado. Tente recarregar a página ou voltar
              para a home.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-400 mb-8">
                Código: {error.digest}
              </p>
            )}
            <Link
              href="/"
              className="px-6 py-3 text-white text-sm font-semibold rounded-full inline-block"
              style={{ backgroundColor: 'rgb(9, 110, 171)' }}
            >
              Voltar para a home
            </Link>
          </section>
        </main>
      </body>
    </html>
  );
}
