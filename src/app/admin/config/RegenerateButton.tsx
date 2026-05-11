'use client';

import { useState, useTransition } from 'react';
import { regenerateSchedulesAction } from './actions';

export default function RegenerateButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function onClick() {
    setResult(null);
    startTransition(async () => {
      const res = await regenerateSchedulesAction();
      if (res.ok) {
        setResult(`${res.created} novos slots criados.`);
      } else {
        setResult(`Falha: ${res.error}`);
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="bg-[rgb(9,110,171)] text-white text-sm px-4 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Gerando…' : 'Regenerar agora'}
      </button>
      {result && <span className="text-sm text-gray-700">{result}</span>}
    </div>
  );
}
