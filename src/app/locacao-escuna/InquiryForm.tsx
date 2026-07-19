'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { createInquiryAction } from './actions';
import TurnstileWidget from '@/components/TurnstileWidget';
import { analytics } from '@/lib/analytics';

const MIN_HOURS = 3;
const MAX_PASSENGERS = 120;

function diffHours(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if ([sh, sm, eh, em].some((x) => Number.isNaN(x))) return null;
  return eh + em / 60 - (sh + sm / 60);
}

function todayIsoDate(): string {
  const tz = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  return tz; // YYYY-MM-DD
}

export default function InquiryForm() {
  const minDate = useMemo(() => todayIsoDate(), []);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [passengerCount, setPassengerCount] = useState<number | ''>('');
  const [interestedInOpenBar, setInterestedInOpenBar] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ url: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const handleTurnstileToken = useCallback((t: string | null) => setTurnstileToken(t), []);

  const durationHours = diffHours(startTime, endTime);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setError('Preencha nome, e-mail e telefone.');
      return;
    }
    if (!requestedDate) {
      setError('Escolha a data do passeio.');
      return;
    }
    if (!startTime || !endTime) {
      setError('Defina o horário de início e fim.');
      return;
    }
    if (durationHours == null || durationHours < MIN_HOURS) {
      setError(`O passeio precisa durar pelo menos ${MIN_HOURS} horas.`);
      return;
    }
    if (
      typeof passengerCount !== 'number' ||
      passengerCount < 1 ||
      passengerCount > MAX_PASSENGERS
    ) {
      setError(`Quantidade de pessoas deve ser entre 1 e ${MAX_PASSENGERS}.`);
      return;
    }
    if (!turnstileToken) {
      setError('Aguarde a verificação anti-spam carregar.');
      return;
    }

    startTransition(async () => {
      const result = await createInquiryAction({
        email,
        fullName,
        phone,
        requestedDate,
        startTime,
        endTime,
        passengerCount,
        interestedInOpenBar,
        message: message || undefined,
        turnstileToken,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess({ url: result.whatsappUrl });
      analytics.generateLead('locacao-escuna');
      // Open WhatsApp in a new tab automatically
      window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer');
    });
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-6">
        <h3 className="font-semibold mb-2">Solicitação registrada!</h3>
        <p className="text-sm mb-4">
          Já abrimos o WhatsApp em uma nova aba com seus dados pré-preenchidos. Se
          a aba não abriu, clique no botão abaixo.
        </p>
        <a
          href={success.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 text-white text-sm font-semibold rounded-full"
          style={{ backgroundColor: 'rgb(9, 110, 171)' }}
        >
          Abrir WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nome completo" required>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="E-mail" required>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </Field>
        <Field label="Telefone (com DDD)" required>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(22) 99999-9999"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </Field>
      </div>

      <Field label="Data do passeio" required>
        <input
          type="date"
          required
          min={minDate}
          value={requestedDate}
          onChange={(e) => setRequestedDate(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Horário de início" required>
          <input
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </Field>
        <Field label="Horário de retorno" required>
          <input
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </Field>
      </div>
      {durationHours != null && (
        <p
          className={`text-xs ${
            durationHours >= MIN_HOURS ? 'text-gray-500' : 'text-red-600'
          }`}
        >
          Duração: {durationHours.toFixed(1)}h (mínimo de {MIN_HOURS}h).
        </p>
      )}

      <Field label={`Quantidade de pessoas (até ${MAX_PASSENGERS})`} required>
        <input
          type="number"
          required
          min={1}
          max={MAX_PASSENGERS}
          value={passengerCount}
          onChange={(e) =>
            setPassengerCount(e.target.value === '' ? '' : Number(e.target.value))
          }
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </Field>

      <label className="flex items-start gap-3 border border-gray-200 rounded-md p-4">
        <input
          type="checkbox"
          checked={interestedInOpenBar}
          onChange={(e) => setInterestedInOpenBar(e.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="block font-medium text-gray-800">
            Tenho interesse em open bar
          </span>
          <span className="block text-sm text-gray-600">
            Inclui drinks, caipirinhas e refrigerantes a bordo (orçamento à parte).
          </span>
        </span>
      </label>

      <Field label="Mensagem / observações (opcional)">
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ocasião, restrições, preferências..."
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </Field>

      <TurnstileWidget onToken={handleTurnstileToken} action="inquiry" />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !turnstileToken}
        className="w-full px-6 py-4 text-white text-base font-semibold rounded-full disabled:opacity-50"
        style={{ backgroundColor: 'rgb(9, 110, 171)' }}
      >
        {isPending ? 'Enviando...' : 'Enviar e abrir WhatsApp'}
      </button>
      <p className="text-xs text-center text-gray-500">
        Salvamos sua solicitação e abrimos o WhatsApp com seus dados para você
        finalizar a conversa com a equipe.
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
