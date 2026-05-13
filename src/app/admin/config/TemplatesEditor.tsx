'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import {
  createScheduleTemplateAction,
  updateScheduleTemplateAction,
  deleteScheduleTemplateAction,
} from './actions';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export type TourOption = {
  id: string;
  name: string;
  slug: string;
  tour_type: string;
  base_price_cents: number | null;
};

export type TemplateRow = {
  id: string;
  tour_id: string;
  tour_name: string;
  tour_type: string;
  weekday: number;
  departure_time: string; // HH:MM ou HH:MM:SS
  capacity: number;
  price_cents: number | null;
  active: boolean;
};

type Props = {
  templates: TemplateRow[];
  tours: TourOption[];
};

function priceToInput(cents: number | null): string {
  if (cents == null) return '';
  return (cents / 100).toFixed(2).replace('.', ',');
}

function parsePrice(value: string): number | null | 'invalid' {
  const t = value.trim();
  if (!t) return null;
  const clean = t.replace(/\./g, '').replace(',', '.');
  const n = Number(clean);
  if (!Number.isFinite(n) || n < 0) return 'invalid';
  return Math.round(n * 100);
}

export default function TemplatesEditor({ templates, tours }: Props) {
  return (
    <div className="space-y-4">
      <AddTemplateForm tours={tours} />

      {templates.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded">
          Nenhum template configurado.
        </p>
      ) : (
        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">Tour</th>
                <th className="px-3 py-2">Dia</th>
                <th className="px-3 py-2">Horário</th>
                <th className="px-3 py-2 text-right">Capacidade</th>
                <th className="px-3 py-2 text-right">Preço (R$)</th>
                <th className="px-3 py-2 text-center">Ativo</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <TemplateRowEditor key={t.id} template={t} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TemplateRowEditor({ template }: { template: TemplateRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [weekday, setWeekday] = useState(template.weekday);
  const [time, setTime] = useState(template.departure_time.slice(0, 5));
  const [capacity, setCapacity] = useState(String(template.capacity));
  const [price, setPrice] = useState(priceToInput(template.price_cents));
  const [active, setActive] = useState(template.active);

  const dirty =
    weekday !== template.weekday ||
    time !== template.departure_time.slice(0, 5) ||
    Number(capacity) !== template.capacity ||
    priceToInput(template.price_cents) !== price ||
    active !== template.active;

  function save() {
    setErr(null);
    const cap = Number(capacity);
    if (!Number.isInteger(cap) || cap <= 0) {
      setErr('Capacidade inválida');
      return;
    }
    const parsedPrice = parsePrice(price);
    if (parsedPrice === 'invalid') {
      setErr('Preço inválido');
      return;
    }
    startTransition(async () => {
      const res = await updateScheduleTemplateAction({
        templateId: template.id,
        weekday,
        departureTime: time,
        capacity: cap,
        priceCents: parsedPrice === null ? -1 : parsedPrice,
        active,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });
  }

  function remove() {
    if (!confirm(`Deletar template "${WEEKDAYS[template.weekday]} ${template.departure_time.slice(0, 5)}"?`)) return;
    setErr(null);
    startTransition(async () => {
      const res = await deleteScheduleTemplateAction(template.id);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <tr className="border-t border-gray-100">
      <td className="px-3 py-2">
        <div className="text-gray-900">{template.tour_name}</div>
        <div className="text-xs text-gray-500 capitalize">{template.tour_type}</div>
      </td>
      <td className="px-3 py-2">
        <select
          value={weekday}
          onChange={(e) => setWeekday(Number(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          {WEEKDAYS.map((d, i) => (
            <option key={i} value={i}>{d}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm font-mono w-24"
        />
      </td>
      <td className="px-3 py-2 text-right">
        <input
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm font-mono w-20 text-right"
        />
      </td>
      <td className="px-3 py-2 text-right">
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="(padrão)"
          className="border border-gray-300 rounded px-2 py-1 text-sm font-mono w-24 text-right"
        />
      </td>
      <td className="px-3 py-2 text-center">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="accent-[var(--color-red-600)]"
        />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2 justify-end">
          {err && <span className="text-xs text-red-700">{err}</span>}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || pending}
            className="inline-flex items-center gap-1 bg-[var(--color-charcoal-700)] text-white text-xs font-bold px-3 py-1.5 rounded-full disabled:opacity-40"
          >
            {pending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Salvar
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="inline-flex items-center gap-1 text-[var(--color-red-700)] hover:bg-[var(--color-red-50)] text-xs font-semibold px-2 py-1.5 rounded disabled:opacity-40"
            aria-label="Deletar template"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function AddTemplateForm({ tours }: { tours: TourOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [tourId, setTourId] = useState(tours[0]?.id ?? '');
  const [weekday, setWeekday] = useState(6); // sábado default
  const [time, setTime] = useState('09:30');
  const [capacity, setCapacity] = useState('120');
  const [price, setPrice] = useState('');

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={tours.length === 0}
        className="inline-flex items-center gap-2 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-bold px-4 py-2 rounded-full disabled:opacity-40"
      >
        <Plus size={14} />
        Adicionar template
      </button>
    );
  }

  function submit() {
    setErr(null);
    const cap = Number(capacity);
    if (!Number.isInteger(cap) || cap <= 0) {
      setErr('Capacidade inválida');
      return;
    }
    const parsedPrice = parsePrice(price);
    if (parsedPrice === 'invalid') {
      setErr('Preço inválido');
      return;
    }
    startTransition(async () => {
      const res = await createScheduleTemplateAction({
        tourId,
        weekday,
        departureTime: time,
        capacity: cap,
        priceCents: parsedPrice === null ? null : parsedPrice,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOpen(false);
      setPrice('');
      router.refresh();
    });
  }

  return (
    <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-gray-600 mb-3">
        Novo template
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-3">
        <select
          value={tourId}
          onChange={(e) => setTourId(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm"
        >
          {tours.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          value={weekday}
          onChange={(e) => setWeekday(Number(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm"
        >
          {WEEKDAYS.map((d, i) => (
            <option key={i} value={i}>{d}</option>
          ))}
        </select>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
        />
        <input
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="Capacidade"
          className="border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
        />
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Preço (vazio = padrão)"
          className="border border-gray-300 rounded px-2 py-1.5 text-sm font-mono"
        />
      </div>
      {err && <p className="text-xs text-red-700 mb-2">{err}</p>}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setErr(null);
            setPrice('');
          }}
          disabled={pending}
          className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-white"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !tourId}
          className="inline-flex items-center gap-1 bg-[var(--color-red-600)] text-white text-sm font-bold px-4 py-1.5 rounded-full disabled:opacity-40"
        >
          {pending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Criar
        </button>
      </div>
    </div>
  );
}
