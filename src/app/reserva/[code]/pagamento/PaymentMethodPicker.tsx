'use client';

import { useState } from 'react';
import PixCheckout from './PixCheckout';
import CardCheckout from './CardCheckout';

type Method = 'pix' | 'card';

type Props = {
  bookingCode: string;
  totalCents: number;
};

export default function PaymentMethodPicker({ bookingCode, totalCents }: Props) {
  const [method, setMethod] = useState<Method>('pix');

  return (
    <div>
      <div
        role="tablist"
        aria-label="Forma de pagamento"
        className="grid grid-cols-2 gap-2 mb-6 p-1 bg-gray-100 rounded-full"
      >
        <Tab
          active={method === 'pix'}
          onClick={() => setMethod('pix')}
          label="PIX"
          sub="Aprovação na hora"
        />
        <Tab
          active={method === 'card'}
          onClick={() => setMethod('card')}
          label="Cartão"
          sub="Crédito à vista"
        />
      </div>

      {method === 'pix' ? (
        <PixCheckout bookingCode={bookingCode} totalCents={totalCents} />
      ) : (
        <CardCheckout bookingCode={bookingCode} totalCents={totalCents} />
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-4 py-3 rounded-full text-sm font-semibold transition-colors ${
        active ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-800'
      }`}
    >
      <span className="block">{label}</span>
      <span className="block text-xs font-normal text-gray-500">{sub}</span>
    </button>
  );
}
