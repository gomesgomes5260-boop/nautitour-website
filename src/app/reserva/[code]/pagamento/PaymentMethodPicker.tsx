'use client';

import { useState } from 'react';
import { QrCode, CreditCard } from 'lucide-react';
import PixCheckout from './PixCheckout';
import CardCheckout from './CardCheckout';

type Method = 'pix' | 'card';

type Props = {
  bookingCode: string;
  totalCents: number;
  maxInstallments?: number;
};

export default function PaymentMethodPicker({ bookingCode, totalCents, maxInstallments = 1 }: Props) {
  const [method, setMethod] = useState<Method>('pix');

  return (
    <div>
      <div
        role="tablist"
        aria-label="Forma de pagamento"
        className="grid grid-cols-2 gap-1.5 mb-6 p-1.5 bg-[var(--color-charcoal-100)] rounded-2xl"
      >
        <Tab
          active={method === 'pix'}
          onClick={() => setMethod('pix')}
          Icon={QrCode}
          label="PIX"
          sub="Aprovação na hora"
        />
        <Tab
          active={method === 'card'}
          onClick={() => setMethod('card')}
          Icon={CreditCard}
          label="Cartão"
          sub={maxInstallments > 1 ? `Até ${maxInstallments}x sem juros` : 'Crédito à vista'}
        />
      </div>

      {method === 'pix' ? (
        <PixCheckout bookingCode={bookingCode} totalCents={totalCents} />
      ) : (
        <CardCheckout
          bookingCode={bookingCode}
          totalCents={totalCents}
          maxInstallments={maxInstallments}
        />
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  Icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof QrCode;
  label: string;
  sub: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-white text-[var(--color-charcoal-900)] shadow-[var(--shadow-1)]'
          : 'text-[var(--color-charcoal-500)] hover:text-[var(--color-charcoal-700)]'
      }`}
    >
      <Icon
        size={20}
        className={active ? 'text-[var(--color-red-600)]' : 'text-[var(--color-charcoal-400)]'}
      />
      <span className="text-left">
        <span className="block">{label}</span>
        <span
          className={`block text-[11px] font-normal ${
            active ? 'text-[var(--color-charcoal-500)]' : 'text-[var(--color-charcoal-400)]'
          }`}
        >
          {sub}
        </span>
      </span>
    </button>
  );
}
