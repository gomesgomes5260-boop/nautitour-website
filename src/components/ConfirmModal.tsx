'use client';

import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  error?: string | null;
  success?: string | null;
  disableConfirm?: boolean;
  hideConfirm?: boolean;
};

// Modal compartilhado para confirmações destrutivas/construtivas no admin
// e na área do cliente. Espelha o padrão visual já estabelecido
// (rounded-2xl + backdrop blur + tokens charcoal/red). Inclui:
// - focus trap básico (Tab cycle entre elementos focáveis no modal)
// - ESC fecha
// - role="dialog" aria-modal aria-labelledby/aria-describedby
// - restaura foco no elemento anterior ao fechar
// - lock de scroll do body enquanto aberto
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Voltar',
  destructive = true,
  pending = false,
  error = null,
  success = null,
  disableConfirm = false,
  hideConfirm = false,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Captura o foco anterior + restaura no close. Lock body scroll.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Foca o primeiro elemento focável do dialog (ou o próprio dialog).
    const node = dialogRef.current;
    if (node) {
      const focusable = node.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (focusable ?? node).focus();
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  // ESC + Tab trap.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const node = dialogRef.current;
      if (!node) return;
      const focusables = Array.from(
        node.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('inert'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const confirmBtnClass = destructive
    ? 'bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white'
    : 'bg-[var(--color-charcoal-900)] hover:bg-[var(--color-charcoal-700)] text-white';

  return (
    <div
      className="fixed inset-0 bg-[var(--color-charcoal-900)]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Click no backdrop fecha (mas não no conteúdo).
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby={description ? 'confirm-modal-desc' : undefined}
        tabIndex={-1}
        className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-[var(--shadow-3)] focus:outline-none"
      >
        <h3
          id="confirm-modal-title"
          className="font-display text-xl font-semibold text-[var(--color-charcoal-900)] mb-2"
        >
          {title}
        </h3>
        {description && (
          <div
            id="confirm-modal-desc"
            className="text-sm text-[var(--color-charcoal-700)] mb-4"
          >
            {description}
          </div>
        )}

        {children}

        {error && (
          <div className="rounded-xl bg-[var(--color-red-50)] border border-[var(--color-red-100)] text-[var(--color-red-900)] p-3 text-sm mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 text-sm mb-4">
            {success}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="text-sm font-medium px-4 py-2 rounded-full border border-[var(--color-charcoal-200)] text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>
          {!hideConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={pending || disableConfirm}
              className={`text-sm font-semibold px-5 py-2 rounded-full disabled:opacity-50 transition-colors ${confirmBtnClass}`}
            >
              {pending ? 'Processando…' : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
