'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { createSellerBookingAction } from './actions';

export type ScheduleOption = {
  id: string;
  departureAt: string;
  tourName: string;
  isTest: boolean;
  /** Lancha privativa: preço fixo do barco (não multiplica por passageiro). */
  perSlot: boolean;
  seatsAvailable: number;
  unitPriceCents: number | null;
};

type Passenger = { full_name: string; is_child: boolean };

const PRICE = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const DATE_TIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const inputClass =
  'w-full border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2 text-sm text-[var(--color-charcoal-900)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors';

const labelClass = 'block text-xs font-semibold text-[var(--color-charcoal-500)] mb-1';

export default function NovaReservaForm({ schedules }: { schedules: ScheduleOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [scheduleId, setScheduleId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [passengers, setPassengers] = useState<Passenger[]>([
    { full_name: '', is_child: false },
  ]);
  const [method, setMethod] = useState<'pix' | 'cash' | 'credit_card' | 'debit_card'>('pix');
  const [paidBRL, setPaidBRL] = useState('');
  const [needsPickup, setNeedsPickup] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupRoom, setPickupRoom] = useState('');
  const [notes, setNotes] = useState('');

  const selected = schedules.find((s) => s.id === scheduleId) ?? null;

  const filled = passengers.filter((p) => p.full_name.trim().length > 0);
  const fullCount = filled.filter((p) => !p.is_child).length;
  const childCount = filled.filter((p) => p.is_child).length;

  const totalCents = useMemo(() => {
    if (!selected?.unitPriceCents) return null;
    const unit = selected.unitPriceCents;
    if (selected.perSlot) return unit; // lancha: preço fixo do barco
    return unit * fullCount + Math.floor(unit / 2) * childCount;
  }, [selected, fullCount, childCount]);

  function setPassenger(i: number, patch: Partial<Passenger>) {
    setPassengers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function submit() {
    setErr(null);
    const amountPaidCents = Math.round((Number(paidBRL.replace(',', '.')) || 0) * 100);
    startTransition(async () => {
      const res = await createSellerBookingAction({
        scheduleId,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        passengers,
        amountPaidCents,
        manualPaymentMethod: method,
        needsPickup,
        pickupAddress: needsPickup ? pickupAddress : null,
        pickupRoom: needsPickup ? pickupRoom : null,
        notes: notes || null,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.push(`/vendedor/reservas/${res.bookingCode}`);
    });
  }

  const canSubmit =
    !!scheduleId &&
    customerName.trim().length >= 3 &&
    customerPhone.trim().length >= 8 &&
    filled.length > 0 &&
    (!selected || filled.length <= selected.seatsAvailable);

  return (
    <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 space-y-6">
      <div>
        <label className={labelClass}>Saída *</label>
        <select
          value={scheduleId}
          onChange={(e) => setScheduleId(e.target.value)}
          className={inputClass}
        >
          <option value="">Escolha data e horário</option>
          {schedules.map((s) => (
            <option key={s.id} value={s.id}>
              {DATE_TIME.format(new Date(s.departureAt))} · {s.tourName}
              {s.isTest ? ' (TESTE)' : ''} ·{' '}
              {s.perSlot ? 'barco inteiro' : `${s.seatsAvailable} vagas`} ·{' '}
              {s.unitPriceCents != null ? PRICE.format(s.unitPriceCents / 100) : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nome do cliente *</label>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Telefone/WhatsApp *</label>
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className={inputClass}
            placeholder="(22) 99999-9999"
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>E-mail (opcional — recebe o ticket)</label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Passageiros * (meia = criança)</label>
        <div className="space-y-2">
          {passengers.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={p.full_name}
                onChange={(e) => setPassenger(i, { full_name: e.target.value })}
                className={inputClass}
                placeholder={`Passageiro ${i + 1}`}
              />
              <label className="flex items-center gap-1.5 text-xs text-[var(--color-charcoal-700)] whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={p.is_child}
                  onChange={(e) => setPassenger(i, { is_child: e.target.checked })}
                />
                Meia
              </label>
              {passengers.length > 1 && (
                <button
                  type="button"
                  aria-label="Remover passageiro"
                  onClick={() => setPassengers((prev) => prev.filter((_, idx) => idx !== i))}
                  className="p-1.5 text-[var(--color-charcoal-400)] hover:text-[var(--color-red-600)]"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPassengers((prev) => [...prev, { full_name: '', is_child: false }])}
          className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-[var(--color-red-600)] hover:underline"
        >
          <Plus size={14} /> Adicionar passageiro
        </button>
        {selected && filled.length > selected.seatsAvailable && (
          <p className="text-xs text-[var(--color-red-700)] mt-2">
            Essa saída tem só {selected.seatsAvailable} vagas.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Forma de pagamento do sinal</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
            className={inputClass}
          >
            <option value="pix">PIX</option>
            <option value="cash">Dinheiro</option>
            <option value="credit_card">Cartão de crédito</option>
            <option value="debit_card">Cartão de débito</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Sinal recebido (R$)</label>
          <input
            inputMode="decimal"
            value={paidBRL}
            onChange={(e) => setPaidBRL(e.target.value)}
            className={inputClass}
            placeholder="0,00"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm text-[var(--color-charcoal-900)]">
          <input
            type="checkbox"
            checked={needsPickup}
            onChange={(e) => setNeedsPickup(e.target.checked)}
          />
          Cliente precisa de transfer/pickup
        </label>
        {needsPickup && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <label className={labelClass}>Endereço do pickup *</label>
              <input
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className={inputClass}
                placeholder="Hotel / pousada e endereço"
              />
            </div>
            <div>
              <label className={labelClass}>Quarto (opcional)</label>
              <input
                value={pickupRoom}
                onChange={(e) => setPickupRoom(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label className={labelClass}>Observações</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--color-charcoal-100)]">
        <div className="text-sm text-[var(--color-charcoal-700)]">
          {totalCents != null ? (
            <>
              Total:{' '}
              <strong className="text-[var(--color-charcoal-900)]">
                {PRICE.format(totalCents / 100)}
              </strong>{' '}
              <span className="text-xs text-[var(--color-charcoal-500)]">
                {selected?.perSlot
                  ? '(preço fixo do barco)'
                  : `(${fullCount} inteira${fullCount === 1 ? '' : 's'}${
                      childCount > 0 ? ` + ${childCount} meia${childCount === 1 ? '' : 's'}` : ''
                    })`}
              </span>
            </>
          ) : (
            <span className="text-xs text-[var(--color-charcoal-500)]">
              Escolha a saída e os passageiros pra ver o total.
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !canSubmit}
          className="rounded-xl bg-[var(--color-red-600)] text-white text-sm font-semibold py-2.5 px-6 hover:bg-[var(--color-red-700)] transition-colors disabled:opacity-50"
        >
          {pending ? 'Registrando…' : 'Registrar reserva'}
        </button>
      </div>

      {err && <p className="text-sm text-[var(--color-red-700)]">{err}</p>}
    </div>
  );
}
