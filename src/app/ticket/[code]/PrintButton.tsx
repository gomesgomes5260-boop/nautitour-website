'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-red-600)] text-white text-sm font-semibold py-2.5 px-5 hover:bg-[var(--color-red-700)] transition-colors print:hidden"
    >
      Imprimir ticket
    </button>
  );
}
