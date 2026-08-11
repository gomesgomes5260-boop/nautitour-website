'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { createManualInquiryAction } from './actions';

const inputClass =
  'w-full border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2 text-sm text-[var(--color-charcoal-900)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors';

const labelClass = 'block text-xs font-semibold text-[var(--color-charcoal-500)] mb-1';

/**
 * Cotação manual: operador registra pedidos que chegaram por fora do site
 * (WhatsApp direto, balcão, indicação) pra tudo ficar rastreado no funil.
 */
export default function NewInquiryForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [tourKind, setTourKind] = useState<'lancha' | 'escuna'>('lancha');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [pax, setPax] = useState('');
  const [message, setMessage] = useState('');

  function submit() {
    setErr(null);
    startTransition(async () => {
      const res = await createManualInquiryAction({
        tourKind,
        fullName,
        phone,
        email: email || null,
        requestedDate: requestedDate || null,
        startTime: startTime || null,
        endTime: endTime || null,
        passengerCount: pax ? Number(pax) : null,
        message: message || null,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.push(`/admin/inquiries/${res.inquiryId}`);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
      >
        <Plus size={14} />
        Adicionar cotação
      </button>
    );
  }

  return (
    <div className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6 mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)]">
          Nova cotação manual
        </h2>
        <button
          type="button"
          aria-label="Fechar"
          onClick={() => setOpen(false)}
          className="p-1.5 text-[var(--color-charcoal-400)] hover:text-[var(--color-charcoal-700)]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Tipo *</label>
          <select
            value={tourKind}
            onChange={(e) => setTourKind(e.target.value as 'lancha' | 'escuna')}
            className={inputClass}
          >
            <option value="lancha">Lancha privativa</option>
            <option value="escuna">Escuna / locação</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Nome do cliente *</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Telefone/WhatsApp *</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            placeholder="(22) 99999-9999"
          />
        </div>
        <div>
          <label className={labelClass}>E-mail (opcional)</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Data desejada</label>
          <input type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} className={inputClass} />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className={labelClass}>Início</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
          </div>
          <div className="flex-1">
            <label className={labelClass}>Fim</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Passageiros</label>
          <input
            type="number"
            min={1}
            max={200}
            value={pax}
            onChange={(e) => setPax(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Observações</label>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={inputClass}
            placeholder="Como chegou, o que pediu, valores conversados…"
          />
        </div>
      </div>

      {err && <p className="text-sm text-[var(--color-red-700)]">{err}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={pending || fullName.trim().length < 3 || phone.trim().length < 8}
          className="rounded-full bg-[var(--color-red-600)] text-white text-sm font-semibold py-2 px-6 hover:bg-[var(--color-red-700)] transition-colors disabled:opacity-50"
        >
          {pending ? 'Registrando…' : 'Registrar cotação'}
        </button>
      </div>
    </div>
  );
}
