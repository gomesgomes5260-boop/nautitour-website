'use client';

import { useState, useTransition } from 'react';
import { exportBookingsCsvAction } from './actions';

type Filters = { from: string; to: string; status: string };

export default function ExportCsvButton({ filters }: { filters: Filters }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onClick() {
    setErr(null);
    startTransition(async () => {
      const res = await exportBookingsCsvAction(filters);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex items-center gap-3">
      {err && <span className="text-sm text-red-700">Falha: {err}</span>}
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="bg-white border border-gray-300 text-sm px-3 py-1.5 rounded hover:bg-gray-50 disabled:opacity-50"
      >
        {pending ? 'Gerando…' : 'Exportar CSV'}
      </button>
    </div>
  );
}
