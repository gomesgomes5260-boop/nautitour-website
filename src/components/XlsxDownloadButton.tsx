'use client';

import { useState, useTransition } from 'react';
import { FileSpreadsheet } from 'lucide-react';

type ExportResult =
  | { ok: true; base64: string; filename: string }
  | { ok: false; error: string };

/**
 * Botão genérico "Exportar Excel": chama a server action recebida, converte
 * o base64 em .xlsx e dispara o download no browser.
 */
export default function XlsxDownloadButton({
  exportAction,
  label = 'Exportar Excel',
}: {
  exportAction: () => Promise<ExportResult>;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onClick() {
    setErr(null);
    startTransition(async () => {
      const res = await exportAction();
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      const bytes = Uint8Array.from(atob(res.base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
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
    <div className="inline-flex items-center gap-2 print:hidden">
      {err && <span className="text-xs text-[var(--color-red-700)]">{err}</span>}
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 bg-white border border-[var(--color-charcoal-200)] text-[var(--color-charcoal-700)] text-sm font-medium px-4 py-2 rounded-full hover:bg-[var(--color-charcoal-50)] hover:border-[var(--color-charcoal-300)] disabled:opacity-50 transition-colors"
      >
        <FileSpreadsheet size={14} />
        {pending ? 'Gerando…' : label}
      </button>
    </div>
  );
}
