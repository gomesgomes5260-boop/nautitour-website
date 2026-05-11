'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateInquiryStatusAction, updateInquiryNotesAction } from '../actions';

type InquiryStatus = 'new' | 'contacted' | 'won' | 'lost';

const STATUS_BUTTONS: Array<{ value: InquiryStatus; label: string; cls: string }> = [
  { value: 'contacted', label: 'Marcar contactado', cls: 'bg-blue-600' },
  { value: 'won', label: 'Ganhamos', cls: 'bg-green-600' },
  { value: 'lost', label: 'Perdemos / arquivar', cls: 'bg-gray-600' },
  { value: 'new', label: 'Voltar para "Novo"', cls: 'bg-amber-600' },
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
        <h3 className="text-sm font-semibold mb-2">Status</h3>
        <div className="flex flex-wrap gap-2">
          {STATUS_BUTTONS.map((b) => {
            const active = b.value === currentStatus;
            return (
              <button
                key={b.value}
                type="button"
                disabled={pending || active}
                onClick={() => setStatus(b.value)}
                className={`text-white text-sm px-3 py-1.5 rounded hover:opacity-90 disabled:opacity-50 ${b.cls}`}
              >
                {active ? `✓ ${b.label}` : b.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Notas internas</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Observações da equipe (visível só pra admins)…"
          className="w-full border border-gray-300 rounded p-2 text-sm font-mono"
        />
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            disabled={pending}
            onClick={saveNotes}
            className="bg-[rgb(9,110,171)] text-white text-sm px-4 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
          >
            {pending ? 'Salvando…' : 'Salvar notas'}
          </button>
          {notesSaved && (
            <span className="text-sm text-green-700">{notesSaved}</span>
          )}
        </div>
      </div>

      {err && (
        <p className="text-sm text-red-700">{err}</p>
      )}
    </div>
  );
}
