'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import {
  acceptAll,
  declineAll,
  setConsent,
} from '@/lib/cookie-consent';
import { useCookieConsent } from '@/lib/use-cookie-consent';

const HIDDEN_PREFIXES = ['/admin'];

export default function CookieBanner() {
  const pathname = usePathname();
  const consent = useCookieConsent();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [retargeting, setRetargeting] = useState(false);

  if (HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))) return null;
  if (consent === null && typeof window === 'undefined') return null;
  if (consent !== null) return null;
  if (dismissed) return null;

  function handleAcceptAll() {
    acceptAll();
    setDismissed(true);
  }

  function handleDeclineAll() {
    declineAll();
    setDismissed(true);
  }

  function handleSaveCustom() {
    setConsent({ analytics, retargeting });
    setDismissed(true);
  }

  return (
    <div
      role="dialog"
      aria-label="Preferências de cookies"
      aria-modal="false"
      className="fixed bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:bottom-4 sm:max-w-2xl z-40"
    >
      <div className="bg-white rounded-xl border border-[var(--color-charcoal-100)] shadow-[var(--shadow-3)] px-3 py-2.5 sm:px-4 sm:py-3">
        {!expanded ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-red-50)] text-[var(--color-red-600)] shrink-0">
              <Cookie size={14} />
            </span>
            <p className="flex-1 min-w-0 text-xs text-[var(--color-charcoal-700)] leading-snug">
              Usamos cookies pra melhorar sua experiência.{' '}
              <Link
                href="/politica-de-privacidade"
                className="text-[var(--color-charcoal-900)] font-medium underline-offset-2 hover:underline"
              >
                Saiba mais
              </Link>
              .
            </p>
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="text-xs font-medium px-2.5 py-1.5 rounded-full text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] transition-colors"
              >
                Personalizar
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              >
                Aceitar
              </button>
            </div>
            <button
              type="button"
              onClick={handleDeclineAll}
              aria-label="Recusar — apenas essenciais"
              title="Apenas essenciais"
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-charcoal-500)] hover:bg-[var(--color-charcoal-50)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-red-50)] text-[var(--color-red-600)] shrink-0">
                <Cookie size={14} />
              </span>
              <p className="font-display text-sm font-semibold text-[var(--color-charcoal-900)] flex-1">
                Preferências de cookies
              </p>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Fechar"
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-charcoal-500)] hover:bg-[var(--color-charcoal-50)] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-2.5 border-t border-[var(--color-charcoal-100)] pt-3">
              <ConsentToggle
                label="Essenciais"
                description="Sessão, segurança, carrinho. Sempre ativos."
                checked
                disabled
              />
              <ConsentToggle
                label="Analíticos"
                description="GA4 e Microsoft Clarity. Métricas anônimas."
                checked={analytics}
                onChange={setAnalytics}
              />
              <ConsentToggle
                label="Marketing"
                description="Remarketing (reservado pra futuro)."
                checked={retargeting}
                onChange={setRetargeting}
              />
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={handleDeclineAll}
                className="text-xs font-medium px-2.5 py-1.5 rounded-full text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] transition-colors"
              >
                Apenas essenciais
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        {/* Mobile (< sm): botões em linha separada pra não estourar largura */}
        {!expanded && (
          <div className="flex sm:hidden items-center gap-1.5 mt-2.5 pt-2.5 border-t border-[var(--color-charcoal-100)]">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex-1 text-xs font-medium px-2 py-1.5 rounded-full text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] transition-colors"
            >
              Personalizar
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="flex-1 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
            >
              Aceitar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConsentToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-2 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 w-3.5 h-3.5 accent-[var(--color-red-600)] disabled:opacity-50"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[var(--color-charcoal-900)]">
          {label}
        </p>
        <p className="text-[11px] text-[var(--color-charcoal-500)] leading-snug">
          {description}
        </p>
      </div>
    </label>
  );
}
