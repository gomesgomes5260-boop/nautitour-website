'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { renderMarkdown, MD_PROSE_CLASS } from '@/lib/markdown';
import { saveStrategyAction } from '../actions';

export default function StrategyEditor({ conteudoInicial }: { conteudoInicial: string }) {
  const [md, setMd] = useState(conteudoInicial);
  const [modo, setModo] = useState<'ver' | 'editar'>('ver');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const html = useMemo(() => renderMarkdown(md), [md]);

  function salvar() {
    if (pending) return;
    setErr(null);
    setOk(false);
    startTransition(async () => {
      const res = await saveStrategyAction(md);
      if (!res.ok) { setErr(res.error); return; }
      setOk(true);
      setModo('ver');
      router.refresh();
      setTimeout(() => setOk(false), 3000);
    });
  }

  return (
    <div className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-5 md:p-8">
      <div className="flex items-center justify-end gap-2 mb-4">
        {ok && <span className="text-xs font-semibold text-[var(--color-success)]">Salvo.</span>}
        {err && <span className="text-xs font-semibold text-[var(--color-red-700)]">{err}</span>}
        {modo === 'ver' ? (
          <button
            type="button"
            onClick={() => setModo('editar')}
            className="rounded-full border border-[var(--color-charcoal-200)] bg-white text-[var(--color-charcoal-900)] text-xs font-bold px-3 py-1.5 hover:border-[var(--color-charcoal-400)] transition-colors"
          >
            Editar
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => { setMd(conteudoInicial); setModo('ver'); }}
              className="rounded-full border border-[var(--color-charcoal-200)] bg-white text-[var(--color-charcoal-700)] text-xs font-bold px-3 py-1.5 hover:border-[var(--color-charcoal-400)] transition-colors"
              disabled={pending}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvar}
              disabled={pending}
              className="rounded-full bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-xs font-bold px-4 py-1.5 transition-colors disabled:opacity-40"
            >
              {pending ? 'Salvando…' : 'Salvar'}
            </button>
          </>
        )}
      </div>

      {modo === 'ver' ? (
        md.trim() ? (
          <div
            className={MD_PROSE_CLASS}
            // renderMarkdown escapa HTML cru (micromark sem allowDangerousHtml)
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="text-sm text-[var(--color-charcoal-500)]">Sem conteúdo — clique em Editar.</p>
        )
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <textarea
            value={md}
            onChange={(e) => setMd(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-charcoal-200)] px-3 py-2 font-mono text-xs min-h-[36rem] focus:outline-none focus:border-[var(--color-charcoal-400)]"
          />
          <div
            className={`rounded-xl border border-[var(--color-charcoal-100)] bg-[var(--color-charcoal-50)] p-4 min-h-[36rem] overflow-y-auto max-h-[42rem] ${MD_PROSE_CLASS}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}
    </div>
  );
}
