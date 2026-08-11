'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Re-renderiza a página server-side em intervalo fixo (router.refresh) —
 * usado no dashboard pra "Atividade recente" atualizar sozinha. Pausa
 * quando a aba está em segundo plano pra não gastar requisição à toa.
 */
export default function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, seconds * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [router, seconds]);

  return null;
}
