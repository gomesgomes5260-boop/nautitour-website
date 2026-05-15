'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { declineAll, setConsent } from '@/lib/cookie-consent';
import { useCookieConsentOrDefault } from '@/lib/use-cookie-consent';

export default function CookiePreferencesForm() {
  const consent = useCookieConsentOrDefault();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function save(next: { analytics?: boolean; retargeting?: boolean }) {
    setConsent({
      analytics: next.analytics ?? consent.analytics,
      retargeting: next.retargeting ?? consent.retargeting,
    });
    setSavedAt(Date.now());
  }

  function handleRevoke() {
    declineAll();
    setSavedAt(Date.now());
  }

  const hasConsentRecorded = consent.updatedAt !== new Date(0).toISOString();

  return (
    <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-8 shadow-[var(--shadow-1)] space-y-5">
      <Category
        label="Cookies essenciais"
        description="Sessão, autenticação, carrinho e proteção CSRF. Sem isso o site não funciona — não dá pra desativar."
        checked
        disabled
      />
      <Category
        label="Cookies analíticos"
        description="Google Analytics 4 e Microsoft Clarity. Métricas agregadas e anônimas (IP anonimizado) pra entender comportamento e melhorar o site."
        checked={consent.analytics}
        onChange={(v) => save({ analytics: v })}
      />
      <Category
        label="Cookies de marketing"
        description="Reservado pra futuras integrações de remarketing (Meta Pixel, Google Ads). Hoje não usamos."
        checked={consent.retargeting}
        onChange={(v) => save({ retargeting: v })}
      />

      <div className="border-t border-[var(--color-charcoal-100)] pt-5 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-[var(--color-charcoal-500)]">
          {hasConsentRecorded ? (
            <>
              Última atualização:{' '}
              <span className="font-mono">{formatRelative(consent.updatedAt)}</span>
            </>
          ) : (
            'Sem preferências registradas ainda.'
          )}
        </p>
        <button
          type="button"
          onClick={handleRevoke}
          className="text-xs font-medium px-3 py-2 rounded-full border border-[var(--color-charcoal-200)] text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] transition-colors"
        >
          Revogar tudo
        </button>
      </div>

      {savedAt && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 text-sm flex items-center gap-2">
          <Check size={14} />
          Preferências salvas.
        </div>
      )}
    </div>
  );
}

function Category({
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
    <div className="flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-charcoal-900)]">
          {label}
        </p>
        <p className="text-xs text-[var(--color-charcoal-500)] mt-1 leading-relaxed">
          {description}
        </p>
      </div>
      <label
        className={`relative inline-flex items-center shrink-0 ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-[var(--color-charcoal-200)] peer-checked:bg-[var(--color-red-600)] rounded-full transition-colors" />
        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
      </label>
    </div>
  );
}

function formatRelative(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}
