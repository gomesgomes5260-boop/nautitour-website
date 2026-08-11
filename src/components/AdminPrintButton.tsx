'use client';

import { Printer } from 'lucide-react';

/**
 * Botão "Imprimir / PDF" das telas do admin. Usa o print do navegador —
 * as páginas têm CSS `print:` que esconde navegação/filtros e compacta a
 * tabela; "salvar como PDF" do navegador vira o export.
 */
export default function AdminPrintButton({ label = 'Imprimir / PDF' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 bg-white border border-[var(--color-charcoal-200)] text-[var(--color-charcoal-700)] text-sm font-medium px-4 py-2 rounded-full hover:bg-[var(--color-charcoal-50)] hover:border-[var(--color-charcoal-300)] transition-colors print:hidden"
    >
      <Printer size={14} />
      {label}
    </button>
  );
}
