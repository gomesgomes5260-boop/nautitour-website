'use client';

import { useState, useTransition } from 'react';
import { createBookingAction } from './actions';

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
      });
      // On success, server action redirects (this branch only runs on error)
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section>
        <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(9, 110, 171)' }}>
          Dados do responsável
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nome completo" required>
            <input
              type="text"
              required
              value={contact.fullName}
              onChange={(e) => setContact({ ...contact, fullName: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </Field>
          <Field label="E-mail" required>
            <input
              type="email"
              required
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </Field>
          <Field label="Telefone (com DDD)" required>
            <input
              type="tel"
              required
              value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="(22) 99999-9999"
            />
          </Field>
          <Field label="CPF (opcional)">
            <input
              type="text"
              value={contact.cpf}
              onChange={(e) => setContact({ ...contact, cpf: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </Field>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold" style={{ color: 'rgb(9, 110, 171)' }}>
            Passageiros ({passengers.length})
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setPassengers((p) =>
                  p.length > 1 ? p.slice(0, -1) : p
                )
              }
              disabled={passengers.length <= 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              −
            </button>
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
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {passengers.map((p, idx) => (
            <div key={idx} className="border border-gray-200 rounded-md p-4">
              <p className="text-sm font-medium text-gray-600 mb-3">
                Passageiro {idx + 1}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Nome completo" required>
                  <input
                    type="text"
                    required
                    value={p.full_name}
                    onChange={(e) => updatePassenger(idx, { full_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </Field>
                <Field label="Documento (opcional)">
                  <input
                    type="text"
                    value={p.document}
                    onChange={(e) => updatePassenger(idx, { document: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 mt-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={p.is_child}
                  onChange={(e) => updatePassenger(idx, { is_child: e.target.checked })}
                />
                Criança (até 12 anos)
              </label>
            </div>
          ))}
        </div>
      </section>

      <section>
        <Field label="Observações (opcional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Restrições alimentares, idade das crianças, dúvidas..."
          />
        </Field>
      </section>

      <section className="bg-gray-50 rounded-lg p-6">
        <div className="flex justify-between items-center mb-2 text-gray-700">
          {pricingMode === 'per_slot' ? (
            <span>
              Lancha privativa — {passengers.length}{' '}
              {passengers.length === 1 ? 'pessoa' : 'pessoas'} (preço fixo do barco)
            </span>
          ) : (
            <span>
              {passengers.length} {passengers.length === 1 ? 'passageiro' : 'passageiros'} ×{' '}
              {PRICE_FORMATTER.format(unitPriceCents / 100)}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center text-2xl font-bold" style={{ color: 'rgb(219, 56, 44)' }}>
          <span>Total</span>
          <span>{PRICE_FORMATTER.format(total / 100)}</span>
        </div>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-6 py-4 text-white text-base font-semibold rounded-full disabled:opacity-50"
        style={{ backgroundColor: 'rgb(9, 110, 171)' }}
      >
        {isPending ? 'Reservando...' : 'Confirmar reserva'}
      </button>
      <p className="text-xs text-center text-gray-500">
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
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
    </label>
  );
}
