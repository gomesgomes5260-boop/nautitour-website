'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { renderMarkdown, MD_PROSE_CLASS } from '@/lib/markdown';
import { REDE_LABEL, TIPO_LABEL, type SocialRede, type SocialTipo } from './redes';
import { createPostAction, updatePostAction } from './actions';

export type PostFormValues = {
  slug: string;
  titulo: string;
  pilar: string;
  persona: string;
  rede: SocialRede;
  formato: string;
  tipo: SocialTipo;
  legenda: string;
  hashtags: string;
  ctaTexto: string;
  ctaUrl: string;
  agendadoPara: string; // datetime-local
  lote: string;
  estrategiaMd: string;
};

const VAZIO: PostFormValues = {
  slug: '', titulo: '', pilar: '', persona: '', rede: 'instagram_feed',
  formato: '', tipo: 'imagem', legenda: '', hashtags: '', ctaTexto: '',
  ctaUrl: '', agendadoPara: '', lote: '', estrategiaMd: '',
};

const campo = 'w-full rounded-xl border border-[var(--color-charcoal-200)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-charcoal-400)] bg-white';
const rotulo = 'block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-charcoal-500)] mb-1';

export default function PostForm({ postId, initial }: { postId?: string; initial?: PostFormValues }) {
  const [v, setV] = useState<PostFormValues>(initial ?? VAZIO);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [preview, setPreview] = useState(true);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const set = <K extends keyof PostFormValues>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setV((prev) => ({ ...prev, [k]: e.target.value }));

  const previewHtml = useMemo(
    () => (preview ? renderMarkdown(v.estrategiaMd) : ''),
    [preview, v.estrategiaMd]
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setErr(null);
    setOk(false);
    startTransition(async () => {
      const res = postId ? await updatePostAction(postId, v) : await createPostAction(v);
      if (!res.ok) { setErr(res.error); return; }
      setOk(true);
      if (!postId && 'id' in res && res.id) router.push(`/admin/posts/${res.id}`);
      else router.refresh();
      setTimeout(() => setOk(false), 3000);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={rotulo}>Título *</label>
          <input className={campo} value={v.titulo} onChange={set('titulo')} required maxLength={160} />
        </div>
        <div>
          <label className={rotulo}>Slug *</label>
          <input
            className={`${campo} font-mono text-xs`}
            value={v.slug}
            onChange={set('slug')}
            required
            pattern="[a-z0-9][a-z0-9-]{0,79}"
            title="minúsculas, números e hífens"
            placeholder="2026-10-lancamento-minha-peca"
          />
        </div>
        <div>
          <label className={rotulo}>Lote</label>
          <input className={campo} value={v.lote} onChange={set('lote')} placeholder="2026-10-lancamento" />
        </div>
        <div>
          <label className={rotulo}>Rede *</label>
          <select className={campo} value={v.rede} onChange={set('rede')}>
            {Object.entries(REDE_LABEL).map(([val, l]) => (
              <option key={val} value={val}>{l}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={rotulo}>Tipo *</label>
            <select className={campo} value={v.tipo} onChange={set('tipo')}>
              {Object.entries(TIPO_LABEL).map(([val, l]) => (
                <option key={val} value={val}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={rotulo}>Formato</label>
            <input className={campo} value={v.formato} onChange={set('formato')} placeholder="9x16 · 4x5 · 1x1 · 16x9" />
          </div>
        </div>
        <div>
          <label className={rotulo}>Pilar de conteúdo</label>
          <input className={campo} value={v.pilar} onChange={set('pilar')} placeholder="5. Venda" />
        </div>
        <div>
          <label className={rotulo}>Persona</label>
          <input className={campo} value={v.persona} onChange={set('persona')} placeholder="Felipe (grupo)" />
        </div>
        <div className="sm:col-span-2">
          <label className={rotulo}>Legenda sugerida</label>
          <textarea className={`${campo} min-h-28`} value={v.legenda} onChange={set('legenda')} />
        </div>
        <div className="sm:col-span-2">
          <label className={rotulo}>Hashtags (separadas por espaço)</label>
          <input className={campo} value={v.hashtags} onChange={set('hashtags')} placeholder="#buzios #passeiodebarco" />
        </div>
        <div>
          <label className={rotulo}>CTA (texto)</label>
          <input className={campo} value={v.ctaTexto} onChange={set('ctaTexto')} placeholder="Reserve pelo link" />
        </div>
        <div>
          <label className={rotulo}>CTA (link de destino)</label>
          <input className={campo} value={v.ctaUrl} onChange={set('ctaUrl')} placeholder="https://nautitour.com.br/..." />
        </div>
        <div>
          <label className={rotulo}>Dia/horário sugerido (agendado para)</label>
          <input type="datetime-local" className={campo} value={v.agendadoPara} onChange={set('agendadoPara')} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={rotulo}>Estratégia da peça (Markdown)</label>
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="text-xs font-semibold text-[var(--color-charcoal-500)] hover:text-[var(--color-charcoal-900)]"
          >
            {preview ? 'Ocultar preview' : 'Mostrar preview'}
          </button>
        </div>
        <div className={`grid gap-3 ${preview ? 'lg:grid-cols-2' : ''}`}>
          <textarea
            className={`${campo} font-mono text-xs min-h-72`}
            value={v.estrategiaMd}
            onChange={set('estrategiaMd')}
            placeholder={'# Título\n\n## Objetivo\n…'}
          />
          {preview && (
            <div
              className={`rounded-xl border border-[var(--color-charcoal-100)] bg-[var(--color-charcoal-50)] p-4 min-h-72 overflow-y-auto max-h-[32rem] ${MD_PROSE_CLASS}`}
              // renderMarkdown escapa HTML cru (micromark sem allowDangerousHtml)
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </div>
      </div>

      {err && <p className="text-xs font-semibold text-[var(--color-red-700)]">{err}</p>}
      {ok && <p className="text-xs font-semibold text-[var(--color-success)]">Salvo.</p>}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-bold px-6 py-2.5 transition-colors disabled:opacity-40"
      >
        {pending ? 'Salvando…' : postId ? 'Salvar alterações' : 'Criar peça'}
      </button>
    </form>
  );
}
