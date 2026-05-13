'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { updateInquiryStatusAction, updateInquiryNotesAction } from '../actions';

type InquiryStatus = 'new' | 'contacted' | 'won' | 'lost';

const STATUS_BUTTONS: Array<{ value: InquiryStatus; label: string; tone: string }> = [
  {
    value: 'contacted',
    label: 'Marcar contactado',
    tone: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
  },
  {
    value: 'won',
    label: 'Ganhamos',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  },
  {
    value: 'lost',
    label: 'Perdemos / arquivar',
    tone: 'bg-[var(--color-charcoal-50)] text-[var(--color-charcoal-700)] border-[var(--color-charcoal-200)] hover:bg-[var(--color-charcoal-100)]',
  },
  {
    value: 'new',
    label: 'Voltar para "Novo"',
    tone: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
  },
];

export default function InquiryActions({
  inquiryId,
  currentStatus,
  initialNotes,
}: {
  inquiryId: string;
  currentStatus: InquiryStatus;
  initialNotes: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [notes, setNotes] = useState(initialNotes);
  const [notesSaved, setNotesSaved] = useState<string | null>(null);

  function setStatus(s: InquiryStatus) {
    setErr(null);
    startTransition(async () => {
      const res = await updateInquiryStatusAction(inquiryId, s);
      if (!res.ok) setErr(res.error);
      else router.refresh();
    });
  }

  function saveNotes() {
    setErr(null);
    setNotesSaved(null);
    startTransition(async () => {
      const res = await updateInquiryNotesAction(inquiryId, notes);
      if (!res.ok) setErr(res.error);
      else {
        setNotesSaved('Notas salvas.');
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--color-charcoal-500)] mb-3">
          Status
        </h3>
        <div className="flex flex-wrap gap-2">
          {STATUS_BUTTONS.map((b) => {
            const active = b.value === currentStatus;
            return (
              <button
                key={b.value}
                type="button"
                disabled={pending || active}
                onClick={() => setStatus(b.value)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${b.tone}`}
              >
                {active && <Check size={12} />}
                {b.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--color-charcoal-500)] mb-3">
          Notas internas
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Observações da equipe (visível só pra admins)…"
          className="w-full border border-[var(--color-charcoal-200)] rounded-lg p-2.5 text-sm font-mono text-[var(--color-charcoal-900)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors"
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            disabled={pending}
            onClick={saveNotes}
            className="bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-50 transition-colors"
          >
            {pending ? 'Salvando…' : 'Salvar notas'}
          </button>
          {notesSaved && (
            <span className="text-xs text-emerald-700">{notesSaved}</span>
          )}
        </div>
      </div>

      {err && (
        <p className="text-sm text-[var(--color-red-700)]">{err}</p>
      )}
    </div>
  );
}
