'use client';

import { useState, useTransition, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, Eye, Trash2, ChevronLeft } from 'lucide-react';
import {
  createPostAction,
  updatePostAction,
  deletePostAction,
  type PostInput,
} from '@/app/admin/blog/actions';
import { slugify } from '@/lib/blog';
import CoverImageUpload from './CoverImageUpload';

// BlockNote roda só client-side e tem deps grandes — lazy load pra não bloquear navegação
const BlockNoteEditor = dynamic(() => import('./BlockNoteEditor'), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-[var(--color-charcoal-200)] bg-white p-8 text-center text-sm text-[var(--color-charcoal-500)]">
      Carregando editor…
    </div>
  ),
});

const inputClass =
  'w-full border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2 text-sm text-[var(--color-charcoal-900)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors';

const textareaClass = `${inputClass} resize-none`;

export type Category = { id: string; name: string };

export type PostFormInitial = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: unknown;
  coverImageUrl: string | null;
  coverImageAlt: string;
  categoryId: string | null;
  status: 'draft' | 'published';
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string | null;
  publishedAt: string | null; // ISO ou null
};

type Props = {
  initial: PostFormInitial;
  categories: Category[];
  mode: 'create' | 'edit';
};

export default function PostForm({ initial, categories, mode }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [content, setContent] = useState<unknown>(initial.content);
  const [coverImageUrl, setCoverImageUrl] = useState(initial.coverImageUrl);
  const [coverImageAlt, setCoverImageAlt] = useState(initial.coverImageAlt);
  const [categoryId, setCategoryId] = useState<string | null>(initial.categoryId);
  const [status, setStatus] = useState(initial.status);
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle);
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription);
  const [ogImageUrl, setOgImageUrl] = useState(initial.ogImageUrl);
  const [publishedAt, setPublishedAt] = useState(initial.publishedAt);

  // initialContent é capturado uma vez — BlockNote não rerenderiza por mudança de prop
  const initialEditorContent = useMemo(() => initial.content, [initial.content]);

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  function buildPayload(targetStatus: 'draft' | 'published'): PostInput {
    return {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      coverImageUrl,
      coverImageAlt: coverImageAlt || null,
      categoryId: categoryId || null,
      status: targetStatus,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      ogImageUrl,
      publishedAt:
        targetStatus === 'published'
          ? publishedAt ?? new Date().toISOString()
          : publishedAt,
    };
  }

  function save(targetStatus: 'draft' | 'published') {
    setErr(null);
    const payload = buildPayload(targetStatus);
    startTransition(async () => {
      const res = mode === 'create'
        ? await createPostAction(payload)
        : await updatePostAction(initial.id!, payload);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setStatus(targetStatus);
      if (targetStatus === 'published' && !publishedAt) {
        setPublishedAt(payload.publishedAt);
      }
      if (mode === 'create' && 'id' in res) {
        router.push(`/admin/blog/${res.id}/editar`);
        return;
      }
      router.refresh();
    });
  }

  function remove() {
    if (!initial.id) return;
    if (!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    setErr(null);
    startTransition(async () => {
      const res = await deletePostAction(initial.id!);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.push('/admin/blog');
    });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/blog"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-charcoal-600)] hover:text-[var(--color-charcoal-900)]"
          >
            <ChevronLeft size={14} />
            Voltar pra listagem
          </Link>
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-charcoal-900)] mt-2">
            {mode === 'create' ? 'Novo post' : 'Editar post'}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {mode === 'edit' && status === 'published' && (
            <Link
              href={`/blog/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-charcoal-700)] bg-white border border-[var(--color-charcoal-200)] hover:border-[var(--color-charcoal-300)]"
            >
              <Eye size={14} />
              Ver
            </Link>
          )}
          {mode === 'edit' && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-red-700)] bg-white border border-red-200 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={14} />
              Apagar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6">
        {/* Coluna principal */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-[var(--color-charcoal-600)] mb-1">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Ex: 5 melhores praias de Búzios pra visitar de escuna"
              className={`${inputClass} text-base`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-charcoal-600)] mb-1">
              Slug (URL)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--color-charcoal-500)] shrink-0">
                /blog/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                placeholder="5-melhores-praias-buzios"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-charcoal-600)] mb-1">
              Resumo (excerpt)
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              placeholder="Frase curta que aparece no card da listagem e na meta description (se SEO description estiver vazio)."
              className={textareaClass}
            />
          </div>

          <CoverImageUpload
            label="Imagem de capa"
            hint="Obrigatória pra publicar. Aparece no topo do post e no card da listagem."
            value={coverImageUrl}
            onChange={setCoverImageUrl}
          />

          {coverImageUrl && (
            <div>
              <label className="block text-xs font-medium text-[var(--color-charcoal-600)] mb-1">
                Texto alternativo (alt)
              </label>
              <input
                type="text"
                value={coverImageAlt}
                onChange={(e) => setCoverImageAlt(e.target.value)}
                placeholder="Descreva a imagem pra leitores de tela e SEO"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--color-charcoal-600)] mb-1">
              Conteúdo
            </label>
            <BlockNoteEditor
              initialContent={initialEditorContent}
              onChange={setContent}
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="bg-white border border-[var(--color-charcoal-200)] rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-charcoal-600)]">
              Publicação
            </h2>
            <div>
              <label className="block text-xs font-medium text-[var(--color-charcoal-600)] mb-1">
                Status
              </label>
              <span
                className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                  status === 'published'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {status === 'published' ? 'Publicado' : 'Rascunho'}
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-charcoal-600)] mb-1">
                Data de publicação
              </label>
              <input
                type="datetime-local"
                value={publishedAt ? toDatetimeLocal(publishedAt) : ''}
                onChange={(e) => setPublishedAt(fromDatetimeLocal(e.target.value))}
                className={inputClass}
              />
              <p className="text-xs text-[var(--color-charcoal-500)] mt-1">
                Vazio → preenche com agora ao publicar.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-charcoal-600)] mb-1">
                Categoria
              </label>
              <select
                value={categoryId ?? ''}
                onChange={(e) => setCategoryId(e.target.value || null)}
                className={inputClass}
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => save('draft')}
                disabled={pending}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-charcoal-700)] bg-white border border-[var(--color-charcoal-300)] hover:bg-[var(--color-charcoal-50)] disabled:opacity-50"
              >
                <Save size={14} />
                Salvar rascunho
              </button>
              <button
                type="button"
                onClick={() => save('published')}
                disabled={pending}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] disabled:opacity-50"
              >
                <Save size={14} />
                {status === 'published' ? 'Atualizar publicação' : 'Publicar'}
              </button>
            </div>
          </div>

          <div className="bg-white border border-[var(--color-charcoal-200)] rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-charcoal-600)]">
              SEO
            </h2>
            <div>
              <label className="block text-xs font-medium text-[var(--color-charcoal-600)] mb-1">
                Title (meta)
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Vazio → usa o título"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-charcoal-600)] mb-1">
                Description
              </label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
                maxLength={320}
                placeholder="Vazio → usa o excerpt"
                className={textareaClass}
              />
              <p className="text-xs text-[var(--color-charcoal-500)] mt-1">
                {seoDescription.length}/320
              </p>
            </div>
            <CoverImageUpload
              label="Imagem Open Graph"
              hint="Vazio → usa a imagem de capa."
              value={ogImageUrl}
              onChange={setOgImageUrl}
            />
          </div>
        </aside>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {err}
        </div>
      )}
    </div>
  );
}

function toDatetimeLocal(iso: string): string {
  // ISO em UTC → string compatível com input[type=datetime-local] no fuso BRT (UTC-3)
  const d = new Date(iso);
  const brt = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 16);
}

function fromDatetimeLocal(s: string): string | null {
  // Input "YYYY-MM-DDTHH:mm" é interpretado como BRT (UTC-3) → converte pra UTC
  if (!s) return null;
  const [datePart, timePart] = s.split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi] = timePart.split(':').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h + 3, mi, 0)).toISOString();
}
