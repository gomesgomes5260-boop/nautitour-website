'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, AlertTriangle } from 'lucide-react';
import { editScheduleAction } from './actions';

type Props = {
  scheduleId: string;
  currentDepartureAt: string; // ISO UTC
  currentCapacity: number;
  currentPriceCents: number | null;
  currentStatus: 'open' | 'sold_out' | 'cancelled';
  tourBasePriceCents: number | null;
  seatsTaken: number;
  activeBookingsCount: number;
};

// Formata ISO UTC pra string `YYYY-MM-DDTHH:mm` em BRT (UTC-3) — input
// datetime-local trabalha em "horário local sem tz", então a gente subtrai
// 3h da UTC pra obter BRT visível.
function isoToBRTInputValue(iso: string): string {
  const d = new Date(iso);
  // Date.getTime() é UTC; subtrai 3h pra "fingir" BRT em UTC string
  const brt = new Date(d.getTime() - 3 * 3600 * 1000);
  const yyyy = brt.getUTCFullYear();
  const mm = String(brt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(brt.getUTCDate()).padStart(2, '0');
  const hh = String(brt.getUTCHours()).padStart(2, '0');
  const mi = String(brt.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// Inverso: pega o valor do input (local BRT) e retorna ISO UTC
function brtInputToIso(value: string): string {
  // value é tipo '2026-05-15T10:30' — interpretamos como BRT
  // BRT é UTC-3, então UTC = BRT + 3h
  const [datePart, timePart] = value.split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi] = timePart.split(':').map(Number);
  // Constrói UTC com +3h shift
  return new Date(Date.UTC(y, mo - 1, d, h + 3, mi, 0)).toISOString();
}

function reaisToInputValue(cents: number | null): string {
  if (cents == null) return '';
  return (cents / 100).toFixed(2).replace('.', ',');
}

function parseReais(value: string): number | null {
  const clean = value.trim().replace(/\./g, '').replace(',', '.');
  if (!clean) return null;
  const n = Number(clean);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export default function EditScheduleForm({
  scheduleId,
  currentDepartureAt,
  currentCapacity,
  currentPriceCents,
  currentStatus,
  tourBasePriceCents,
  seatsTaken,
  activeBookingsCount,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [depValue, setDepValue] = useState(isoToBRTInputValue(currentDepartureAt));
  const [capacityValue, setCapacityValue] = useState(String(currentCapacity));
  const [priceValue, setPriceValue] = useState(
    reaisToInputValue(currentPriceCents)
  );
  const [usesOverride, setUsesOverride] = useState(currentPriceCents != null);
  const [statusValue, setStatusValue] = useState<'open' | 'sold_out' | 'cancelled'>(
    currentStatus
  );
  const [notify, setNotify] = useState(true);

  const initialDepValue = isoToBRTInputValue(currentDepartureAt);
  const depChanged = depValue !== initialDepValue;
  const capacityChanged = Number(capacityValue) !== currentCapacity;
  const priceChanged = usesOverride
    ? parseReais(priceValue) !== currentPriceCents
    : currentPriceCents != null;
  const statusChanged = statusValue !== currentStatus;
  const dirty = depChanged || capacityChanged || priceChanged || statusChanged;

  const capacityNum = Number(capacityValue);
  const capacityValid =
    capacityValue.trim() !== '' && Number.isInteger(capacityNum) && capacityNum >= seatsTaken;
  const priceValid = !usesOverride || parseReais(priceValue) != null;

  const willNotify = notify && depChanged && activeBookingsCount > 0;

  function submit() {
    if (!dirty) return;
    if (!capacityValid) {
      setErr(`Capacidade precisa ser ≥ ${seatsTaken} (passageiros já reservados).`);
      return;
    }
    if (!priceValid) {
      setErr('Preço inválido.');
      return;
    }
    setErr(null);
    setSuccess(null);

    startTransition(async () => {
      const res = await editScheduleAction({
        scheduleId,
        departureAt: depChanged ? brtInputToIso(depValue) : null,
        capacity: capacityChanged ? capacityNum : null,
        priceCents: priceChanged
          ? usesOverride
            ? parseReais(priceValue)
            : -1
          : null,
        status: statusChanged ? statusValue : null,
        notifyCustomers: notify,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      const parts: string[] = ['Saída atualizada.'];
      if (res.notified > 0) parts.push(`${res.notified} e-mail(s) enviados.`);
      if (res.skipped > 0) parts.push(`${res.skipped} falharam.`);
      setSuccess(parts.join(' '));
      router.refresh();
      setTimeout(() => setSuccess(null), 4000);
    });
  }

  return (
    <div className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-5 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-charcoal-100)] text-[var(--color-charcoal-700)]">
          <Calendar size={18} />
        </span>
        <div>
          <h2 className="font-display text-lg md:text-xl font-semibold text-[var(--color-charcoal-900)] tracking-tight">
            Editar saída
          </h2>
          <p className="text-xs text-[var(--color-charcoal-500)]">
            Altere data, hora, capacidade, preço ou status.
            {activeBookingsCount > 0 &&
              ` ${activeBookingsCount} booking(s) ativa(s) serão notificadas se a data/hora mudar.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-charcoal-500)] mb-1">
            Data e hora (BRT)
          </label>
          <input
            type="datetime-local"
            value={depValue}
            onChange={(e) => setDepValue(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-charcoal-200)] rounded-md font-mono text-sm focus:outline-none focus:border-[var(--color-charcoal-700)]"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-charcoal-500)] mb-1">
            Capacidade (≥ {seatsTaken})
          </label>
          <input
            type="number"
            min={Math.max(seatsTaken, 1)}
            value={capacityValue}
            onChange={(e) => setCapacityValue(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-charcoal-200)] rounded-md font-mono text-sm focus:outline-none focus:border-[var(--color-charcoal-700)]"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-charcoal-500)] mb-1">
            <input
              type="checkbox"
              checked={usesOverride}
              onChange={(e) => setUsesOverride(e.target.checked)}
              className="accent-[var(--color-red-600)]"
            />
            Preço sobrescrito
          </label>
          <input
            type="text"
            disabled={!usesOverride}
            value={priceValue}
            onChange={(e) => setPriceValue(e.target.value)}
            placeholder={tourBasePriceCents ? `Padrão R$ ${(tourBasePriceCents / 100).toFixed(2).replace('.', ',')}` : 'R$ 0,00'}
            className="w-full px-3 py-2 border border-[var(--color-charcoal-200)] rounded-md font-mono text-sm focus:outline-none focus:border-[var(--color-charcoal-700)] disabled:bg-[var(--color-charcoal-50)] disabled:text-[var(--color-charcoal-400)]"
          />
          <p className="text-[10px] text-[var(--color-charcoal-500)] mt-1">
            {usesOverride
              ? 'Esse preço vale só pra essa saída.'
              : `Usa preço base do tour${tourBasePriceCents != null ? ` (R$ ${(tourBasePriceCents / 100).toFixed(2).replace('.', ',')})` : ''}.`}
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-charcoal-500)] mb-1">
            Status
          </label>
          <select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value as typeof statusValue)}
            className="w-full px-3 py-2 border border-[var(--color-charcoal-200)] rounded-md text-sm focus:outline-none focus:border-[var(--color-charcoal-700)]"
          >
            <option value="open">Aberta</option>
            <option value="sold_out">Esgotada</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>
      </div>

      {activeBookingsCount > 0 && depChanged && (
        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="accent-amber-700"
              />
              <span className="font-semibold">
                Notificar {activeBookingsCount} cliente(s) por e-mail sobre a mudança
              </span>
            </label>
            <p className="mt-1">
              {willNotify
                ? 'Vamos enviar um e-mail informando o novo horário pra todos.'
                : 'A mudança será salva sem notificar (não recomendado).'}
            </p>
          </div>
        </div>
      )}

      {err && <p className="mt-3 text-xs text-[var(--color-red-700)] font-semibold">{err}</p>}
      {success && <p className="mt-3 text-xs text-[var(--color-success)] font-semibold">{success}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!dirty || !capacityValid || !priceValid || pending}
        className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-900)] text-white font-bold text-sm px-6 py-2.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? 'Salvando…' : dirty ? 'Salvar alterações' : 'Sem alterações'}
      </button>
    </div>
  );
}
