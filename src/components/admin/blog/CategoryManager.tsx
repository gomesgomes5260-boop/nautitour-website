'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from '@/app/admin/blog/actions';
import { slugify } from '@/lib/blog';

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

const inputClass =
  'w-full border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2 text-sm text-[var(--color-charcoal-900)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors';

export default function CategoryManager({
  categories,
}: {
  categories: CategoryRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  // Form de criação
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');

  // Estado de edição inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDescription, setEditDescription] = useState('');

  function autoSlug(raw: string) {
    if (slugTouched) return;
    setSlug(slugify(raw));
  }

  function create() {
    setErr(null);
    startTransition(async () => {
      const res = await createCategoryAction({
        name,
        slug: slug || undefined,
        description: description || null,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setName('');
      setSlug('');
      setSlugTouched(false);
      setDescription('');
      router.refresh();
    });
  }

  function startEdit(c: CategoryRow) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditSlug(c.slug);
    setEditDescription(c.description ?? '');
    setErr(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setErr(null);
  }

  function saveEdit(id: string) {
    setErr(null);
    startTransition(async () => {
      const res = await updateCategoryAction(id, {
        name: editName,
        slug: editSlug,
        description: editDescription || null,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  }

  function remove(c: CategoryRow) {
    if (!confirm(`Remover categoria "${c.name}"? Posts dela ficarão sem categoria.`)) return;
    setErr(null);
    startTransition(async () => {
      const res = await deleteCategoryAction(c.id);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Form de criação */}
      <div className="bg-white border border-[var(--color-charcoal-200)] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[var(--color-charcoal-900)] mb-4">
          Nova categoria
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-charcoal-600)] mb-1">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                autoSlug(e.target.value);
              }}
              placeholder="Ex: Praias"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-charcoal-600)] mb-1">
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="praias"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[var(--color-charcoal-600)] mb-1">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Curiosidades sobre as praias de Búzios"
              className={inputClass}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={create}
          disabled={pending || !name.trim()}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] disabled:opacity-50 transition-colors"
        >
          <Plus size={14} />
          {pending ? 'Salvando…' : 'Adicionar'}
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white border border-[var(--color-charcoal-200)] rounded-xl overflow-hidden">
        {categories.length === 0 ? (
          <p className="p-6 text-center text-sm text-[var(--color-charcoal-500)]">
            Nenhuma categoria cadastrada ainda.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-charcoal-100)]">
            {categories.map((c) => {
              const isEditing = editingId === c.id;
              return (
                <li key={c.id} className="p-4">
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nome"
                        className={inputClass}
                      />
                      <input
                        type="text"
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        placeholder="slug"
                        className={inputClass}
                      />
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Descrição"
                        className={`${inputClass} sm:col-span-2`}
                      />
                      <div className="sm:col-span-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(c.id)}
                          disabled={pending}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check size={14} />
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={pending}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-charcoal-700)] bg-[var(--color-charcoal-100)] hover:bg-[var(--color-charcoal-200)]"
                        >
                          <X size={14} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--color-charcoal-900)]">
                          {c.name}
                        </p>
                        <p className="text-xs text-[var(--color-charcoal-500)] mt-0.5">
                          /blog?categoria={c.slug}
                          {c.description && ` · ${c.description}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Editar"
                          onClick={() => startEdit(c)}
                          className="p-2 rounded-lg text-[var(--color-charcoal-600)] hover:bg-[var(--color-charcoal-100)]"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label="Remover"
                          onClick={() => remove(c)}
                          disabled={pending}
                          className="p-2 rounded-lg text-[var(--color-red-600)] hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {err}
        </div>
      )}
    </div>
  );
}
