'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { tokenizeCard } from '@/lib/pagarme/tokenize';
import { createCardForBookingAction } from './actions';

type Props = {
  bookingCode: string;
  totalCents: number;
  maxInstallments?: number;
};

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const MIN_INSTALLMENT_CENTS = 10000; // R$ 100,00

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function CardCheckout({ bookingCode, totalCents, maxInstallments = 1 }: Props) {
  const router = useRouter();
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'tokenizing' | 'charging'>('idle');
  const [isPending, startTransition] = useTransition();

  // Cap baseado no valor: cada parcela precisa ter >= R$ 100,00.
  const allowedInstallments = Math.max(
    1,
    Math.min(maxInstallments, Math.floor(totalCents / MIN_INSTALLMENT_CENTS) || 1)
  );
  const [installments, setInstallments] = useState<number>(allowedInstallments > 1 ? allowedInstallments : 1);

  const submitting = isPending || phase !== 'idle';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const digits = number.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) {
      setError('Número de cartão inválido.');
      return;
    }
    const [monthStr, yearStr] = expiry.split('/');
    const month = Number(monthStr);
    const year = Number(yearStr ? (yearStr.length === 2 ? `20${yearStr}` : yearStr) : '');
    if (!month || month < 1 || month > 12 || !year) {
      setError('Validade inválida.');
      return;
    }
    if (!cvv || cvv.length < 3) {
      setError('CVV inválido.');
      return;
    }
    if (!holder.trim()) {
      setError('Informe o nome impresso no cartão.');
      return;
    }

    startTransition(async () => {
      try {
        setPhase('tokenizing');
        const token = await tokenizeCard({
          number: digits,
          holderName: holder,
          expMonth: month,
          expYear: year,
          cvv,
        });

        setPhase('charging');
        const result = await createCardForBookingAction({
          bookingCode,
          cardToken: token.id,
          cardHolderName: holder,
          installments,
        });

        if (!result.ok) {
          setError(result.error);
          setPhase('idle');
          return;
        }

        if (result.status === 'paid') {
          router.replace(`/reserva/${result.bookingCode}?paid=1`);
          return;
        }

        // pending: e.g. 3DS/antifraude — refresh and let webhook flip status
        router.refresh();
        setPhase('idle');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao processar cartão');
        setPhase('idle');
      }
    });
  };

  const inputClass =
    'w-full border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2.5 text-[var(--color-charcoal-900)] placeholder:text-[var(--color-charcoal-400)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl bg-[var(--color-charcoal-900)] text-white p-6 sm:p-8">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60 mb-2">
          Total a pagar
        </p>
        <p className="font-sans text-3xl sm:text-4xl font-black text-[var(--color-red-300)] leading-none">
          {PRICE_FORMATTER.format(totalCents / 100)}
        </p>
      </div>

      <Field label="Número do cartão" required>
        <input
          type="text"
          inputMode="numeric"
          required
          autoComplete="cc-number"
          value={number}
          onChange={(e) => setNumber(formatCardNumber(e.target.value))}
          placeholder="1234 5678 9012 3456"
          className={`${inputClass} font-mono`}
        />
      </Field>

      <Field label="Nome impresso no cartão" required>
        <input
          type="text"
          required
          autoComplete="cc-name"
          value={holder}
          onChange={(e) => setHolder(e.target.value.toUpperCase())}
          className={`${inputClass} uppercase`}
        />
      </Field>

      {allowedInstallments > 1 && (
        <Field label="Parcelamento">
          <select
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
            className={inputClass}
          >
            {Array.from({ length: allowedInstallments }, (_, i) => i + 1).map((n) => {
              const perInstallment = Math.round(totalCents / n);
              return (
                <option key={n} value={n}>
                  {n}x de {PRICE_FORMATTER.format(perInstallment / 100)}
                  {n === 1 ? ' à vista' : ' sem juros'}
                </option>
              );
            })}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Validade (MM/AA)" required>
          <input
            type="text"
            inputMode="numeric"
            required
            autoComplete="cc-exp"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/AA"
            className={`${inputClass} font-mono`}
          />
        </Field>
        <Field label="CVV" required>
          <input
            type="text"
            inputMode="numeric"
            required
            autoComplete="cc-csc"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            className={`${inputClass} font-mono`}
          />
        </Field>
      </div>

      {error && (
        <div className="rounded-xl bg-[var(--color-red-50)] border border-[var(--color-red-100)] text-[var(--color-red-900)] p-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-6 py-4 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-base font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[var(--shadow-2)]"
      >
        {phase === 'tokenizing'
          ? 'Validando cartão...'
          : phase === 'charging'
            ? 'Processando pagamento...'
            : `Pagar ${PRICE_FORMATTER.format(totalCents / 100)}`}
      </button>
      <p className="text-xs text-center text-[var(--color-charcoal-500)]">
        Seus dados de cartão são enviados diretamente para a Pagar.me. Não
        armazenamos número, validade ou CVV.
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
