'use client';

import { useCallback, useRef, useState, useTransition } from 'react';
import type { SiteImage } from './actions';
import Image from 'next/image';
import { UploadCloud, Trash2, Link as LinkIcon, Loader2, FolderPlus } from 'lucide-react';
import {
  listSiteImagesAction,
  uploadSiteImageAction,
  deleteSiteImagesAction,
} from './actions';

// Pastas padrão espelham public/images/photos + destinos novos.
const DEFAULT_FOLDERS = [
  'escuna',
  'ilhas',
  'aerea',
  'buzios',
  'lancha-privativa',
  'equipe',
  'drinks-bordo',
  'clientes',
  'capas',
  'blog',
  'misc',
];

const MAX_SIDE = 2560;
const WEBP_QUALITY = 0.82;

type UploadItem = { name: string; status: 'processing' | 'sending' | 'done' | 'error'; info?: string };

function formatBytes(n: number | null): string {
  if (n == null) return '';
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Otimiza no browser antes do upload: redimensiona pra máx 2560px no lado
 * maior e re-encoda WebP. Se o resultado ficar maior que o original (raro,
 * ex.: PNG pequeno), mantém o original — o que for menor vence.
 */
async function optimizeImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, '') + '.webp';
    return new File([blob], newName, { type: 'image/webp' });
  } catch {
    // Formato que o browser não decodifica — manda o original.
    return file;
  }
}

export default function ImageLibrary({
  canManage,
  initialFolders,
  initialFolder,
  initialImages,
}: {
  canManage: boolean;
  initialFolders: string[];
  initialFolder: string;
  initialImages: SiteImage[];
}) {
  const [folders, setFolders] = useState<string[]>(() =>
    Array.from(new Set([...DEFAULT_FOLDERS, ...initialFolders]))
  );
  const [folder, setFolder] = useState<string>(initialFolder);
  const [images, setImages] = useState<SiteImage[]>(initialImages);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newFolder, setNewFolder] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Carga inicial vem do servidor (initialImages); troca de pasta é event
  // handler — nada de setState em effect (regra react-hooks/set-state-in-effect).
  const changeFolder = useCallback((f: string) => {
    setFolder(f);
    setLoading(true);
    setSelected(new Set());
    startTransition(async () => {
      const res = await listSiteImagesAction(f);
      if (res.ok) {
        setImages(res.images);
        setErr(null);
      } else {
        setErr(res.error);
      }
      setLoading(false);
    });
  }, []);

  async function handleFiles(fileList: FileList | File[]) {
    if (!canManage) return;
    setErr(null);
    setNotice(null);
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      setErr('Nenhuma imagem válida selecionada.');
      return;
    }

    for (const file of files) {
      setUploads((prev) => [...prev, { name: file.name, status: 'processing' }]);
      const optimized = await optimizeImage(file);
      const savedPct =
        optimized.size < file.size
          ? ` (${formatBytes(file.size)} → ${formatBytes(optimized.size)})`
          : '';
      setUploads((prev) =>
        prev.map((u) =>
          u.name === file.name ? { ...u, status: 'sending', info: savedPct } : u
        )
      );

      const fd = new FormData();
      fd.set('file', optimized);
      fd.set('folder', folder);
      const res = await uploadSiteImageAction(fd);
      setUploads((prev) =>
        prev.map((u) =>
          u.name === file.name
            ? res.ok
              ? { ...u, status: 'done' }
              : { ...u, status: 'error', info: res.error }
            : u
        )
      );
      if (res.ok) {
        setImages((prev) => [res.image, ...prev]);
      }
    }

    // Limpa a lista de progresso depois de um tempo.
    setTimeout(() => {
      setUploads((prev) => prev.filter((u) => u.status === 'error'));
    }, 4000);
  }

  function toggleSelect(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Excluir ${selected.size} imagem${selected.size === 1 ? '' : 'ns'}? Essa ação não tem volta.`)) {
      return;
    }
    startTransition(async () => {
      const res = await deleteSiteImagesAction(Array.from(selected));
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setImages((prev) => prev.filter((img) => !selected.has(img.path)));
      setSelected(new Set());
      setNotice(`${res.deleted} imagem${res.deleted === 1 ? '' : 'ns'} excluída${res.deleted === 1 ? '' : 's'}.`);
    });
  }

  async function copySelectedUrl() {
    const path = Array.from(selected)[0];
    const img = images.find((i) => i.path === path);
    if (!img) return;
    await navigator.clipboard.writeText(img.url);
    setNotice('URL copiada!');
    setTimeout(() => setNotice(null), 2500);
  }

  function addFolder() {
    const name = newFolder.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{0,49}$/.test(name)) {
      setErr('Nome de pasta inválido (letras minúsculas, números e hífen).');
      return;
    }
    setFolders((prev) => Array.from(new Set([...prev, name])));
    changeFolder(name);
    setNewFolder('');
    setShowNewFolder(false);
  }

  return (
    <div className="space-y-5">
      {/* Abas de pasta */}
      <div className="flex flex-wrap items-center gap-2">
        {folders.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => changeFolder(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
              f === folder
                ? 'bg-[var(--color-charcoal-900)] text-white border-[var(--color-charcoal-900)]'
                : 'bg-white text-[var(--color-charcoal-700)] border-[var(--color-charcoal-200)] hover:border-[var(--color-charcoal-400)]'
            }`}
          >
            {f}
          </button>
        ))}
        {canManage &&
          (showNewFolder ? (
            <span className="inline-flex items-center gap-1.5">
              <input
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addFolder()}
                placeholder="nova-pasta"
                autoFocus
                className="border border-[var(--color-charcoal-200)] rounded-full px-3 py-1.5 text-xs w-32 focus:outline-none focus:border-[var(--color-red-600)]"
              />
              <button
                type="button"
                onClick={addFolder}
                className="text-xs font-semibold text-[var(--color-red-600)] hover:underline"
              >
                Criar
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewFolder(true)}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--color-charcoal-500)] border border-dashed border-[var(--color-charcoal-300)] hover:text-[var(--color-charcoal-900)]"
            >
              <FolderPlus size={13} /> pasta
            </button>
          ))}
      </div>

      {/* Dropzone (só owner) */}
      {canManage && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? 'border-[var(--color-red-600)] bg-[var(--color-red-50)]'
              : 'border-[var(--color-charcoal-200)] bg-white hover:border-[var(--color-charcoal-400)]'
          }`}
        >
          <UploadCloud size={28} className="mx-auto mb-2 text-[var(--color-charcoal-400)]" />
          <p className="text-sm font-semibold text-[var(--color-charcoal-900)]">
            Arraste fotos aqui ou clique pra escolher
          </p>
          <p className="text-xs text-[var(--color-charcoal-500)] mt-1">
            Pode mandar em alta resolução — a gente redimensiona pra 2560px e
            converte pra WebP antes de subir (pasta: <strong>{folder}</strong>)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {/* Progresso de uploads */}
      {uploads.length > 0 && (
        <ul className="space-y-1">
          {uploads.map((u, i) => (
            <li key={`${u.name}-${i}`} className="flex items-center gap-2 text-xs">
              {u.status === 'done' ? (
                <span className="text-emerald-600 font-bold">✓</span>
              ) : u.status === 'error' ? (
                <span className="text-[var(--color-red-600)] font-bold">✕</span>
              ) : (
                <Loader2 size={12} className="animate-spin text-[var(--color-charcoal-400)]" />
              )}
              <span className="text-[var(--color-charcoal-700)] truncate">{u.name}</span>
              {u.info && <span className="text-[var(--color-charcoal-400)]">{u.info}</span>}
              {u.status === 'processing' && (
                <span className="text-[var(--color-charcoal-400)]">otimizando…</span>
              )}
              {u.status === 'sending' && (
                <span className="text-[var(--color-charcoal-400)]">enviando…</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Barra de ações da seleção */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-3 rounded-xl bg-[var(--color-charcoal-900)] text-white px-4 py-2.5 shadow-lg">
          <span className="text-sm font-semibold">{selected.size} selecionada{selected.size === 1 ? '' : 's'}</span>
          {selected.size === 1 && (
            <button
              type="button"
              onClick={copySelectedUrl}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white"
            >
              <LinkIcon size={13} /> Copiar URL
            </button>
          )}
          {canManage && (
            <button
              type="button"
              onClick={deleteSelected}
              disabled={pending}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-300 hover:text-red-200 disabled:opacity-50"
            >
              <Trash2 size={13} /> Excluir
            </button>
          )}
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-white/60 hover:text-white"
          >
            Limpar seleção
          </button>
        </div>
      )}

      {err && <p className="text-sm text-[var(--color-red-700)]">{err}</p>}
      {notice && <p className="text-sm text-emerald-700">{notice}</p>}

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <Loader2 size={22} className="animate-spin mx-auto text-[var(--color-charcoal-400)]" />
        </div>
      ) : images.length === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--color-charcoal-500)]">
          Nenhuma imagem na pasta <strong>{folder}</strong> ainda.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {images.map((img) => {
            const isSelected = selected.has(img.path);
            return (
              <div
                key={img.path}
                className={`group relative rounded-xl overflow-hidden border-2 transition-colors ${
                  isSelected
                    ? 'border-[var(--color-red-600)]'
                    : 'border-transparent hover:border-[var(--color-charcoal-300)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSelect(img.path)}
                  className="block w-full aspect-square relative bg-[var(--color-charcoal-100)]"
                  aria-pressed={isSelected}
                >
                  <Image
                    src={img.url}
                    alt={img.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
                    className="object-cover"
                  />
                  <span
                    className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-opacity ${
                      isSelected
                        ? 'bg-[var(--color-red-600)] border-[var(--color-red-600)] text-white opacity-100'
                        : 'bg-white/80 border-white opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <p className="text-[10px] text-white truncate">{img.name}</p>
                  <p className="text-[10px] text-white/70">
                    {formatBytes(img.sizeBytes)}
                    {' · '}
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline pointer-events-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      abrir
                    </a>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
