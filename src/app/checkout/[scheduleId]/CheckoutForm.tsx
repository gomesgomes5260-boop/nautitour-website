'use client';

import { useState, useTransition, useCallback, useRef } from 'react';
import { createBookingAction } from './actions';
import { captureLeadAction } from './lead-actions';
import TurnstileWidget from '@/components/TurnstileWidget';
import { analytics } from '@/lib/analytics';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Passenger = { full_name: string; document: string; is_child: boolean };

type Props = {
  scheduleId: string;
  unitPriceCents: number;
  /**
   * 'per_passenger' (escuna): total = unitPrice × passengers.
   * 'per_slot' (lancha privativa): total = unitPrice (boat rental, fixed).
   */
  pricingMode: 'per_passenger' | 'per_slot';
  maxPassengers: number;
};

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function CheckoutForm({
  scheduleId,
  unitPriceCents,
  pricingMode,
  maxPassengers,
}: Props) {
  const [contact, setContact] = useState({
    fullName: '',
    email: '',
    phone: '',
    cpf: '',
  });
  const [passengers, setPassengers] = useState<Passenger[]>([
    { full_name: '', document: '', is_child: false },
  ]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const handleTurnstileToken = useCallback((t: string | null) => setTurnstileToken(t), []);

  // Dedup de lead capture por email — não dispara 2x pro mesmo valor na
  // mesma sessão (typing → tab → typing → tab continuaria gerando 1 lead só).
  const capturedEmailRef = useRef<string | null>(null);

  const handleEmailBlur = () => {
    const email = contact.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return;
    if (capturedEmailRef.current === email) return;
    capturedEmailRef.current = email;
    // Fire-and-forget — não bloqueia o submit nem mostra feedback.
    void captureLeadAction({
      email,
      fullName: contact.fullName.trim() || undefined,
      phone: contact.phone.trim() || undefined,
      source: 'checkout_abandon',
    }).catch(() => {
      // Best-effort. Re-permite captura se falhou (talvez tenha mais sorte
      // no próximo blur com mesma string).
      capturedEmailRef.current = null;
    });
  };

  const total =
    pricingMode === 'per_slot' ? unitPriceCents : unitPriceCents * passengers.length;

  const updatePassenger = (idx: number, patch: Partial<Passenger>) => {
    setPassengers((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!contact.fullName.trim() || !contact.email.trim() || !contact.phone.trim()) {
      setError('Preencha nome, e-mail e telefone do responsável.');
      return;
    }
    if (passengers.some((p) => !p.full_name.trim())) {
      setError('Informe o nome de cada passageiro.');
      return;
    }
    if (!turnstileToken) {
      setError('Aguarde a verificação anti-spam carregar.');
      return;
    }

    analytics.beginCheckout(scheduleId, total / 100, passengers.length);

    startTransition(async () => {
      const result = await createBookingAction({
        scheduleId,
        email: contact.email,
        fullName: contact.fullName,
        phone: contact.phone,
        cpf: contact.cpf || undefined,
        notes: notes || undefined,
        passengers: passengers.map((p) => ({
          full_name: p.full_name,
          document: p.document || undefined,
          is_child: p.is_child,
        })),
        turnstileToken,
      });
      // On success, server action redirects (this branch only runs on error)
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  };

  const inputClass =
    'w-full border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2.5 text-[var(--color-charcoal-900)] placeholder:text-[var(--color-charcoal-400)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-8">
        <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)] mb-1.5">
          Etapa 1
        </span>
        <h2 className="font-display text-xl sm:text-2xl font-semibold text-[var(--color-charcoal-900)] mb-5">
          Dados do responsável
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nome completo" required>
            <input
              type="text"
              required
              value={contact.fullName}
              onChange={(e) => setContact({ ...contact, fullName: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="E-mail" required>
            <input
              type="email"
              autoComplete="email"
              required
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              onBlur={handleEmailBlur}
              className={inputClass}
            />
          </Field>
          <Field label="Telefone (com DDD)" required>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              className={inputClass}
              placeholder="(22) 99999-9999"
            />
          </Field>
          <Field label="CPF (opcional)">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={contact.cpf}
              onChange={(e) => setContact({ ...contact, cpf: e.target.value })}
              className={inputClass}
              placeholder="123.456.789-00"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-8">
        <div className="flex justify-between items-start mb-5 gap-3">
          <div>
            <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)] mb-1.5">
              Etapa 2
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-[var(--color-charcoal-900)]">
              Passageiros ({passengers.length})
            </h2>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-[var(--color-charcoal-200)] p-1 shrink-0">
            <button
              type="button"
              onClick={() =>
                setPassengers((p) => (p.length > 1 ? p.slice(0, -1) : p))
              }
              disabled={passengers.length <= 1}
              aria-label="Remover passageiro"
              className="w-8 h-8 rounded-full text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-lg leading-none"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-semibold text-[var(--color-charcoal-900)]">
              {passengers.length}
            </span>
            <button
              type="button"
              onClick={() =>
                setPassengers((p) =>
                  p.length < maxPassengers
                    ? [...p, { full_name: '', document: '', is_child: false }]
                    : p
                )
              }
              disabled={passengers.length >= maxPassengers}
              aria-label="Adicionar passageiro"
              className="w-8 h-8 rounded-full text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-lg leading-none"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {passengers.map((p, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[var(--color-charcoal-100)] bg-[var(--color-charcoal-50)] p-4 sm:p-5"
            >
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--color-charcoal-500)] mb-3">
                Passageiro {idx + 1}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Nome completo" required>
                  <input
                    type="text"
                    required
                    value={p.full_name}
                    onChange={(e) => updatePassenger(idx, { full_name: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Documento (opcional)">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={p.document}
                    onChange={(e) => updatePassenger(idx, { document: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 mt-3 text-sm text-[var(--color-charcoal-700)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={p.is_child}
                  onChange={(e) => updatePassenger(idx, { is_child: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--color-charcoal-300)] accent-[var(--color-red-600)]"
                />
                Criança (até 12 anos)
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-8">
        <Field label="Observações (opcional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Restrições alimentares, idade das crianças, dúvidas..."
          />
        </Field>
      </section>

      <section className="rounded-2xl bg-[var(--color-charcoal-900)] text-white p-6 sm:p-8">
        <div className="flex justify-between items-center mb-3 text-sm text-white/70">
          {pricingMode === 'per_slot' ? (
            <span>
              Lancha privativa — {passengers.length}{' '}
              {passengers.length === 1 ? 'pessoa' : 'pessoas'} (preço fixo)
            </span>
          ) : (
            <span>
              {passengers.length} {passengers.length === 1 ? 'passageiro' : 'passageiros'} ×{' '}
              {PRICE_FORMATTER.format(unitPriceCents / 100)}
            </span>
          )}
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60">
            Total
          </span>
          <span className="font-sans text-3xl sm:text-4xl font-black text-[var(--color-red-300)] leading-none">
            {PRICE_FORMATTER.format(total / 100)}
          </span>
        </div>
      </section>

      <TurnstileWidget onToken={handleTurnstileToken} action="checkout" />

      {error && (
        <div className="rounded-xl bg-[var(--color-red-50)] border border-[var(--color-red-100)] text-[var(--color-red-900)] p-4 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !turnstileToken}
        className="w-full px-6 py-4 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-base font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[var(--shadow-2)]"
      >
        {isPending ? 'Reservando...' : 'Confirmar reserva'}
      </button>
      <p className="text-xs text-center text-[var(--color-charcoal-500)]">
        A reserva ficará pendente de pagamento. Você será redirecionado para a tela de
        confirmação com seu código.
      </p>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-[var(--color-charcoal-700)] mb-1.5">
        {label}
        {required && <span className="text-[var(--color-red-600)]"> *</span>}
      </span>
      {children}
    </label>
  );
}
