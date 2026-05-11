'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-[rgb(9,110,171)] text-white text-sm px-4 py-1.5 rounded hover:opacity-90"
    >
      Imprimir
    </button>
  );
}
