'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { tokenizeCard } from '@/lib/pagarme/tokenize';
import { createCardForBookingAction } from './actions';

type Props = {
  bookingCode: string;
  totalCents: number;
  maxInstallments?: number;
  /** Troca a aba de pagamento pro PIX (fallback quando o cartão falha). */
  onSwitchToPix?: () => void;
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

function formatCep(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

type CepResult = { street: string; neighborhood: string; city: string; uf: string };

async function lookupCep(cepDigits: string): Promise<CepResult | null> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.erro) return null;
    return {
      street: data.logradouro ?? '',
      neighborhood: data.bairro ?? '',
      city: data.localidade ?? '',
      uf: data.uf ?? '',
    };
  } catch {
    return null;
  }
}

export default function CardCheckout({
  bookingCode,
  totalCents,
  maxInstallments = 1,
  onSwitchToPix,
}: Props) {
  const router = useRouter();
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Endereço de cobrança (billing_address) — exigido pela antifraude da Stone.
  const [cep, setCep] = useState('');
  const [addrNumber, setAddrNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [street, setStreet] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');
  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const lastCepRef = useRef<string>('');

  const [error, setError] = useState<string | null>(null);
  // true só quando a Pagar.me recusou/errou (não em validação local) — aí
  // oferecemos PIX e atendimento.
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'tokenizing' | 'charging'>('idle');
  const [isPending, startTransition] = useTransition();

  // Cap baseado no valor: cada parcela precisa ter >= R$ 100,00.
  const allowedInstallments = Math.max(
    1,
    Math.min(maxInstallments, Math.floor(totalCents / MIN_INSTALLMENT_CENTS) || 1)
  );
  const [installments, setInstallments] = useState<number>(allowedInstallments > 1 ? allowedInstallments : 1);

  const submitting = isPending || phase !== 'idle';

  const handleCepBlur = async () => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8 || digits === lastCepRef.current) return;
    lastCepRef.current = digits;
    setCepStatus('loading');
    const found = await lookupCep(digits);
    if (!found) {
      // ViaCEP não achou — deixa o cliente completar à mão.
      setCepStatus('error');
      return;
    }
    setStreet(found.street);
    setNeighborhood(found.neighborhood);
    setCity(found.city);
    setUf(found.uf);
    setCepStatus('ok');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPaymentFailed(false);

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

    // Endereço de cobrança
    const cepDigits = cep.replace(/\D/g, '');
    if (cepDigits.length !== 8) {
      setError('Informe um CEP válido (8 dígitos) no endereço de cobrança.');
      return;
    }
    if (!addrNumber.trim()) {
      setError('Informe o número do endereço de cobrança.');
      return;
    }
    if (!street.trim() || !city.trim() || uf.trim().length !== 2) {
      setError('Complete o endereço de cobrança (rua, cidade e UF).');
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
          billing: {
            zipCode: cepDigits,
            number: addrNumber,
            street,
            neighborhood,
            city,
            state: uf,
            complement,
          },
        });

        if (!result.ok) {
          setError(result.error);
          setPaymentFailed(true);
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
        // Falha de tokenização (dados do cartão) — mostra a mensagem da
        // Pagar.me; não é caso de sugerir PIX/atendente.
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

      {/* Endereço de cobrança — exigido pela operadora do cartão. */}
      <fieldset className="rounded-xl border border-[var(--color-charcoal-100)] bg-[var(--color-charcoal-50)] p-4 sm:p-5 space-y-3">
        <legend className="px-1 text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--color-charcoal-500)]">
          Endereço de cobrança do cartão
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-3">
          <Field label="CEP" required>
            <input
              type="text"
              inputMode="numeric"
              required
              autoComplete="postal-code"
              value={cep}
              onChange={(e) => {
                setCep(formatCep(e.target.value));
                if (cepStatus !== 'idle') setCepStatus('idle');
              }}
              onBlur={handleCepBlur}
              placeholder="00000-000"
              className={`${inputClass} font-mono`}
            />
            {cepStatus === 'loading' && (
              <span className="mt-1 block text-xs text-[var(--color-charcoal-500)]">
                Buscando endereço...
              </span>
            )}
            {cepStatus === 'error' && (
              <span className="mt-1 block text-xs text-[var(--color-charcoal-500)]">
                CEP não encontrado — preencha o endereço abaixo.
              </span>
            )}
          </Field>
          <Field label="Número" required>
            <input
              type="text"
              inputMode="numeric"
              required
              autoComplete="off"
              value={addrNumber}
              onChange={(e) => setAddrNumber(e.target.value)}
              placeholder="123"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Logradouro (rua/avenida)" required>
          <input
            type="text"
            required
            autoComplete="address-line1"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-3">
          <Field label="Bairro">
            <input
              type="text"
              autoComplete="address-level3"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Complemento">
            <input
              type="text"
              autoComplete="address-line2"
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
              placeholder="Apto, bloco..."
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-[1fr_88px] gap-3">
          <Field label="Cidade" required>
            <input
              type="text"
              required
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="UF" required>
            <input
              type="text"
              required
              autoComplete="address-level1"
              value={uf}
              onChange={(e) => setUf(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2))}
              placeholder="RJ"
              className={`${inputClass} uppercase`}
            />
          </Field>
        </div>
      </fieldset>

      {error && (
        <div className="rounded-xl bg-[var(--color-red-50)] border border-[var(--color-red-100)] text-[var(--color-red-900)] p-3 text-sm space-y-3">
          <p>{error}</p>
          {paymentFailed && (
            <>
              <p className="text-[var(--color-red-900)]/80">
                Você pode tentar outro cartão, pagar via PIX (aprovação na hora)
                ou falar com nosso atendimento.
              </p>
              <div className="flex flex-wrap gap-2">
                {onSwitchToPix && (
                  <button
                    type="button"
                    onClick={onSwitchToPix}
                    className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full bg-[var(--color-red-600)] text-white hover:bg-[var(--color-red-700)] transition-colors"
                  >
                    Pagar com PIX
                  </button>
                )}
                <a
                  href={`/api/wa?s=pagamento-cartao&code=${encodeURIComponent(bookingCode)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full border border-[var(--color-red-600)] text-[var(--color-red-600)] hover:bg-white transition-colors"
                >
                  Falar com atendente
                </a>
              </div>
            </>
          )}
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
