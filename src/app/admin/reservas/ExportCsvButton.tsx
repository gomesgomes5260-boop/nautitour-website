'use client';

import { useState, useTransition } from 'react';
import { Download } from 'lucide-react';
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
      {err && (
        <span className="text-sm text-[var(--color-red-700)]">Falha: {err}</span>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 bg-white border border-[var(--color-charcoal-200)] text-[var(--color-charcoal-700)] text-sm font-medium px-4 py-2 rounded-full hover:bg-[var(--color-charcoal-50)] hover:border-[var(--color-charcoal-300)] disabled:opacity-50 transition-colors"
      >
        <Download size={14} />
        {pending ? 'Gerando…' : 'Exportar CSV'}
      </button>
    </div>
  );
}
