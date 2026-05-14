'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';
import { attemptRefundAction } from './actions';

const PRICE = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

type Mode = 'total' | 'partial';

// Aceita "60", "60,00", "60.00", "R$ 60,00" → 6000 (centavos). null se inválido.
function parseAmountCents(input: string): number | null {
  const cleaned = input.replace(/[R$\s.]/g, '').replace(',', '.');
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

export default function RefundButton({
  bookingCode,
  totalPaidCents,
}: {
  bookingCode: string;
  totalPaidCents: number;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('total');
  const [partialInput, setPartialInput] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function close() {
    if (pending) return;
    setOpen(false);
    setMode('total');
    setPartialInput('');
    setErr(null);
    setOk(false);
  }

  function submit() {
    setErr(null);
    setOk(false);

    let amountCents: number | undefined;
    if (mode === 'partial') {
      const parsed = parseAmountCents(partialInput);
      if (parsed == null) {
        setErr('Informe um valor válido em reais.');
        return;
      }
      if (parsed > totalPaidCents) {
        setErr(
          `Valor excede o total pago de ${PRICE.format(totalPaidCents / 100)}.`
        );
        return;
      }
      amountCents = parsed;
    }

    startTransition(async () => {
      const res = await attemptRefundAction(bookingCode, amountCents);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOk(true);
      setTimeout(() => {
        close();
        router.refresh();
      }, 1200);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
      >
        Reembolsar via Pagar.me
      </button>

      <ConfirmModal
        open={open}
        onClose={close}
        onConfirm={submit}
        title="Reembolsar via Pagar.me?"
        description="Vamos chamar a API do Pagar.me para devolver o valor ao cliente no mesmo método de pagamento."
        confirmLabel="Confirmar reembolso"
        cancelLabel="Fechar"
        pending={pending}
        error={err}
        success={ok ? 'Reembolso registrado com sucesso.' : null}
        hideConfirm={ok}
      >
        <fieldset className="mb-4" disabled={pending || ok}>
          <legend className="text-sm font-medium text-[var(--color-charcoal-700)] mb-2">
            Tipo de reembolso
          </legend>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-charcoal-900)]">
              <input
                type="radio"
                name="mode"
                value="total"
                checked={mode === 'total'}
                onChange={() => setMode('total')}
                className="w-4 h-4 accent-[var(--color-red-600)]"
              />
              <span>
                Total — <strong>{PRICE.format(totalPaidCents / 100)}</strong>
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-charcoal-900)]">
              <input
                type="radio"
                name="mode"
                value="partial"
                checked={mode === 'partial'}
                onChange={() => setMode('partial')}
                className="w-4 h-4 accent-[var(--color-red-600)]"
              />
              <span>Parcial</span>
            </label>
          </div>
        </fieldset>

        {mode === 'partial' && (
          <div className="mb-4">
            <label
              htmlFor="refund-amount"
              className="block text-sm font-medium text-[var(--color-charcoal-700)] mb-1.5"
            >
              Valor a reembolsar (R$)
            </label>
            <input
              id="refund-amount"
              type="text"
              inputMode="decimal"
              autoFocus
              value={partialInput}
              onChange={(e) => setPartialInput(e.target.value)}
              placeholder="Ex: 60,00"
              disabled={pending || ok}
              className="w-full border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2.5 text-[var(--color-charcoal-900)] placeholder:text-[var(--color-charcoal-400)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors font-mono"
            />
            <p className="text-xs text-[var(--color-charcoal-500)] mt-1.5">
              Entre R$ 0,01 e {PRICE.format(totalPaidCents / 100)}.
            </p>
          </div>
        )}
      </ConfirmModal>
    </>
  );
}
