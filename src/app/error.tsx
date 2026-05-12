'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { extra: { digest: error.digest } });
  }, [error]);

  return (
    <main className="bg-white min-h-screen flex items-center justify-center">
      <section className="px-[60px] py-24 max-w-2xl mx-auto text-center">
        <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">Erro</p>
        <h1 className="text-[36px] font-normal mb-4" style={{ color: 'rgb(219, 56, 44)' }}>
          Algo deu errado
        </h1>
        <p className="text-gray-700 mb-2">
          Encontramos um problema ao carregar esta página. Você pode tentar
          novamente ou voltar para a home.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-8">Código: {error.digest}</p>
        )}
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={reset}
            className="px-6 py-3 text-white text-sm font-semibold rounded-full"
            style={{ backgroundColor: 'rgb(9, 110, 171)' }}
          >
            Tentar de novo
          </button>
          <Link
            href="/"
            className="px-6 py-3 text-sm font-semibold rounded-full border-2"
            style={{ color: 'rgb(9, 110, 171)', borderColor: 'rgb(9, 110, 171)' }}
          >
            Voltar para a home
          </Link>
        </div>
      </section>
    </main>
  );
}
