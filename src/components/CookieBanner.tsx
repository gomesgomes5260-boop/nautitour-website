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

  // useCookieConsent retorna null no SSR e no primeiro render client antes
  // do useSyncExternalStore hidratar. Só mostra o banner se:
  //   - Já hidratou (consent é null ou objeto)
  //   - Sem cookie de consent (consent === null APÓS hidratação) — sem flash
  //   - Usuário não dispensou manualmente nesta sessão
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
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:bottom-6 sm:max-w-md z-40"
    >
      <div className="bg-white rounded-2xl border border-[var(--color-charcoal-100)] shadow-[var(--shadow-3)] p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-red-50)] text-[var(--color-red-600)] shrink-0">
            <Cookie size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-display text-base font-semibold text-[var(--color-charcoal-900)]">
              Usamos cookies
            </p>
            <p className="text-xs text-[var(--color-charcoal-500)] mt-1 leading-relaxed">
              Cookies essenciais fazem o site funcionar. Cookies analíticos nos
              ajudam a melhorar sua experiência. Você escolhe.{' '}
              <Link
                href="/politica-de-privacidade"
                className="text-[var(--color-charcoal-700)] underline-offset-2 hover:underline"
              >
                Saiba mais
              </Link>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={handleDeclineAll}
            aria-label="Fechar — apenas essenciais"
            className="shrink-0 -mr-1 -mt-1 w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-charcoal-500)] hover:bg-[var(--color-charcoal-50)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {expanded && (
          <div className="space-y-3 mb-4 border-t border-[var(--color-charcoal-100)] pt-4">
            <ConsentToggle
              label="Essenciais"
              description="Necessários pro site funcionar (sessão, segurança, carrinho). Sempre ativos."
              checked
              disabled
            />
            <ConsentToggle
              label="Analíticos"
              description="Google Analytics e Microsoft Clarity. Métricas anônimas pra entender o que melhorar."
              checked={analytics}
              onChange={setAnalytics}
            />
            <ConsentToggle
              label="Marketing"
              description="Cookies de remarketing (futuro). Hoje não usamos — opção fica disponível."
              checked={retargeting}
              onChange={setRetargeting}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          {!expanded ? (
            <>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="text-xs font-medium px-3 py-2 rounded-full text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] transition-colors"
              >
                Personalizar
              </button>
              <button
                type="button"
                onClick={handleDeclineAll}
                className="text-xs font-medium px-3 py-2 rounded-full border border-[var(--color-charcoal-200)] text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] transition-colors"
              >
                Apenas essenciais
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors"
              >
                Aceitar tudo
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-xs font-medium px-3 py-2 rounded-full text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors"
              >
                Salvar preferências
              </button>
            </>
          )}
        </div>
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
      className={`flex items-start gap-3 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-[var(--color-red-600)] disabled:opacity-50"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-charcoal-900)]">
          {label}
        </p>
        <p className="text-xs text-[var(--color-charcoal-500)] mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
    </label>
  );
}
