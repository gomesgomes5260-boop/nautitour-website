'use client';

import { useCallback, useMemo, useRef, useState, useTransition } from 'react';
import type { SiteImage, TagCount } from './actions';
import Image from 'next/image';
import {
  UploadCloud,
  Trash2,
  Link as LinkIcon,
  Loader2,
  FolderPlus,
  FolderUp,
  Tag as TagIcon,
} from 'lucide-react';
import {
  listSiteImagesAction,
  listImagesByTagAction,
  uploadSiteImageAction,
  deleteSiteImagesAction,
  markImageUsedAction,
  tagImagesAction,
  untagImagesAction,
} from './actions';
import { SUGGESTED_TAGS, GALLERY_TAGS } from '@/lib/image-tags';

const GALLERY_TAG_SET = new Set<string>(GALLERY_TAGS);

const ALL = '__all__';

type SortMode = 'recent-upload' | 'recent-used';

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
const FOLDER_RE = /^[a-z0-9][a-z0-9-]{0,49}$/;

type UploadItem = {
  key: string;
  name: string;
  folder: string;
  status: 'processing' | 'sending' | 'done' | 'error';
  info?: string;
};

type QueuedFile = { file: File; folder: string };

function formatBytes(n: number | null): string {
  if (n == null) return '';
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Sanitiza nome de pasta pro padrão do bucket (minúsculas, sem acento, hífens). */
function sanitizeFolderName(raw: string): string | null {
  const name = raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return FOLDER_RE.test(name) ? name : null;
}

/**
 * Pasta destino a partir do caminho relativo do arquivo dentro da pasta
 * enviada: usa o nome do diretório PAI imediato (ex.: "fotos/escuna/x.jpg"
 * → "escuna"; "escuna/x.jpg" → "escuna"). Arquivo solto → pasta atual.
 */
function folderFromRelativePath(relPath: string, fallback: string): string {
  const parts = relPath.split('/').filter(Boolean);
  if (parts.length < 2) return fallback;
  return sanitizeFolderName(parts[parts.length - 2]) ?? fallback;
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

/**
 * Percorre recursivamente entradas de um drop (arquivos E pastas) via
 * webkitGetAsEntry, preservando o caminho relativo pra pré-organização.
 */
async function collectDroppedFiles(items: DataTransferItemList): Promise<
  Array<{ file: File; relPath: string }>
> {
  const out: Array<{ file: File; relPath: string }> = [];

  async function walk(entry: FileSystemEntry, prefix: string): Promise<void> {
    if (entry.isFile) {
      const file = await new Promise<File | null>((resolve) =>
        (entry as FileSystemFileEntry).file(resolve, () => resolve(null))
      );
      if (file) out.push({ file, relPath: `${prefix}${file.name}` });
      return;
    }
    if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      // readEntries retorna em lotes — repetir até esvaziar.
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((resolve) =>
          reader.readEntries(resolve, () => resolve([]))
        );
        if (batch.length === 0) break;
        for (const child of batch) {
          await walk(child, `${prefix}${entry.name}/`);
        }
      }
    }
  }

  const entries: FileSystemEntry[] = [];
  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }
  for (const entry of entries) {
    await walk(entry, '');
  }
  return out;
}

export default function ImageLibrary({
  canManage,
  initialFolders,
  initialFolder,
  initialImages,
  initialTags,
}: {
  canManage: boolean;
  initialFolders: string[];
  initialFolder: string;
  initialImages: SiteImage[];
  initialTags: TagCount[];
}) {
  const [folders, setFolders] = useState<string[]>(() =>
    Array.from(new Set([...DEFAULT_FOLDERS, ...initialFolders]))
  );
  const [folder, setFolder] = useState<string>(initialFolder);
  const [images, setImages] = useState<SiteImage[]>(initialImages);
  const [sortMode, setSortMode] = useState<SortMode>('recent-upload');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  // Progresso geral do lote (fotos concluídas / total). Soltar mais fotos
  // no meio do envio SOMA ao total em vez de resetar a barra.
  const [batch, setBatch] = useState<{ total: number; done: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newFolder, setNewFolder] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [tags, setTags] = useState<TagCount[]>(initialTags);
  // Filtro por tag ativo — sobrepõe a visão por pasta enquanto setado.
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Carga inicial vem do servidor (initialImages); troca de pasta é event
  // handler — nada de setState em effect (regra react-hooks/set-state-in-effect).
  const changeFolder = useCallback((f: string) => {
    setFolder(f);
    setTagFilter(null);
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

  const changeTagFilter = useCallback((tag: string) => {
    setTagFilter(tag);
    setLoading(true);
    setSelected(new Set());
    startTransition(async () => {
      const res = await listImagesByTagAction(tag);
      if (res.ok) {
        setImages(res.images);
        setErr(null);
      } else {
        setErr(res.error);
      }
      setLoading(false);
    });
  }, []);

  /** Recarrega a contagem de tags (após taguear/destaguear). */
  const refreshTags = useCallback((delta: Map<string, number>) => {
    setTags((prev) => {
      const byTag = new Map(prev.map((t) => [t.tag, t.count]));
      for (const [tag, d] of delta) {
        byTag.set(tag, Math.max(0, (byTag.get(tag) ?? 0) + d));
      }
      return Array.from(byTag.entries())
        .filter(([, count]) => count > 0)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => a.tag.localeCompare(b.tag));
    });
  }, []);

  function applyTagToSelection() {
    const raw = tagInput.trim();
    if (!raw || selected.size === 0) return;
    const paths = Array.from(selected);
    startTransition(async () => {
      const res = await tagImagesAction(paths, raw);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setErr(null);
      // Anexa a tag localmente só em quem ainda não tinha (contagem correta).
      let added = 0;
      setImages((prev) =>
        prev.map((img) => {
          if (!selected.has(img.path) || img.tags.includes(res.tag)) return img;
          added += 1;
          return { ...img, tags: [...img.tags, res.tag].sort() };
        })
      );
      refreshTags(new Map([[res.tag, added]]));
      setNotice(`Tag "${res.tag}" aplicada em ${paths.length} imagem${paths.length === 1 ? '' : 'ns'}.`);
      setTagInput('');
      setShowTagInput(false);
    });
  }

  function removeTagFromSelection() {
    if (!tagFilter || selected.size === 0) return;
    const paths = Array.from(selected);
    const tag = tagFilter;
    startTransition(async () => {
      const res = await untagImagesAction(paths, tag);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setErr(null);
      // Na visão filtrada, remover a tag = sair da lista.
      setImages((prev) => prev.filter((img) => !selected.has(img.path)));
      refreshTags(new Map([[tag, -paths.length]]));
      setSelected(new Set());
      setNotice(`Tag "${tag}" removida de ${paths.length} imagem${paths.length === 1 ? '' : 'ns'}.`);
    });
  }

  async function uploadQueue(queue: QueuedFile[]) {
    if (!canManage) return;
    setErr(null);
    setNotice(null);

    const valid = queue.filter((q) => q.file.type.startsWith('image/'));
    const skippedNonImage = queue.length - valid.length;
    if (valid.length === 0) {
      setErr('Nenhuma imagem válida selecionada.');
      return;
    }

    setBatch((prev) =>
      prev && prev.done < prev.total
        ? { total: prev.total + valid.length, done: prev.done }
        : { total: valid.length, done: 0 }
    );

    const perFolder = new Map<string, number>();
    const currentFolderAtStart = folder;
    const viewingAll = currentFolderAtStart === ALL;
    let anyToCurrent = false;

    for (const { file, folder: target } of valid) {
      const key = `${target}/${file.name}-${Date.now()}`;
      setUploads((prev) => [
        ...prev,
        { key, name: file.name, folder: target, status: 'processing' },
      ]);

      const optimized = await optimizeImage(file);
      const savedPct =
        optimized.size < file.size
          ? ` (${formatBytes(file.size)} → ${formatBytes(optimized.size)})`
          : '';
      setUploads((prev) =>
        prev.map((u) => (u.key === key ? { ...u, status: 'sending', info: savedPct } : u))
      );

      const fd = new FormData();
      fd.set('file', optimized);
      fd.set('folder', target);
      const res = await uploadSiteImageAction(fd);
      setUploads((prev) =>
        prev.map((u) =>
          u.key === key
            ? res.ok
              ? { ...u, status: 'done' }
              : { ...u, status: 'error', info: res.error }
            : u
        )
      );
      // Conta no progresso geral tanto sucesso quanto erro — a barra mede
      // "quanto falta processar", não "quantas deram certo".
      setBatch((prev) => (prev ? { ...prev, done: prev.done + 1 } : prev));
      if (res.ok) {
        perFolder.set(target, (perFolder.get(target) ?? 0) + 1);
        if (viewingAll || target === currentFolderAtStart) {
          anyToCurrent = true;
          setImages((prev) => [res.image, ...prev]);
        }
      }
    }

    // Pastas novas viram abas.
    setFolders((prev) => Array.from(new Set([...prev, ...perFolder.keys()])));

    const summary = Array.from(perFolder.entries())
      .map(([f, n]) => `${f} (${n})`)
      .join(', ');
    if (summary) {
      setNotice(
        `Enviadas: ${summary}.${skippedNonImage > 0 ? ` ${skippedNonImage} arquivo(s) não-imagem ignorado(s).` : ''}`
      );
    }

    // Se tudo foi pra UMA pasta diferente da atual, muda a visão pra ela.
    const targets = Array.from(perFolder.keys());
    if (!anyToCurrent && targets.length === 1) {
      changeFolder(targets[0]);
    }

    setTimeout(() => {
      setUploads((prev) => prev.filter((u) => u.status === 'error'));
      // Só some com a barra se nenhum lote novo entrou no meio tempo.
      setBatch((prev) => (prev && prev.done >= prev.total ? null : prev));
    }, 4000);
  }

  // Na aba "Todas" não existe pasta concreta — arquivo solto cai em misc.
  const looseTarget = folder === ALL ? 'misc' : folder;

  function handleLooseFiles(fileList: FileList) {
    void uploadQueue(Array.from(fileList).map((file) => ({ file, folder: looseTarget })));
  }

  function handleDirectoryInput(fileList: FileList) {
    const queue = Array.from(fileList).map((file) => {
      const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      return { file, folder: folderFromRelativePath(rel, looseTarget) };
    });
    void uploadQueue(queue);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!canManage) return;
    // webkitGetAsEntry cobre pastas; fallback pra lista simples de arquivos.
    if (e.dataTransfer.items?.length) {
      const collected = await collectDroppedFiles(e.dataTransfer.items);
      if (collected.length > 0) {
        void uploadQueue(
          collected.map(({ file, relPath }) => ({
            file,
            folder: folderFromRelativePath(relPath, looseTarget),
          }))
        );
        return;
      }
    }
    if (e.dataTransfer.files?.length) handleLooseFiles(e.dataTransfer.files);
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
    // Copiar = "usar" — alimenta a ordenação "usadas recentemente".
    const usedAt = new Date().toISOString();
    setImages((prev) =>
      prev.map((i) => (i.path === path ? { ...i, lastUsedAt: usedAt } : i))
    );
    markImageUsedAction(path).catch(() => {
      // best-effort: falha no registro não atrapalha o clipboard
    });
  }

  // Ordenação client-side sobre a lista carregada. "Usadas recentemente"
  // coloca as nunca usadas por último (registro começou na migration 031).
  const displayImages = useMemo(() => {
    if (sortMode === 'recent-used') {
      return [...images].sort((a, b) => {
        if (a.lastUsedAt && b.lastUsedAt) return b.lastUsedAt.localeCompare(a.lastUsedAt);
        if (a.lastUsedAt) return -1;
        if (b.lastUsedAt) return 1;
        return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
      });
    }
    return [...images].sort((a, b) =>
      (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
    );
  }, [images, sortMode]);

  function addFolder() {
    const name = sanitizeFolderName(newFolder);
    if (!name) {
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
      {/* Abas de pasta + ordenação */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => changeFolder(ALL)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors ${
            folder === ALL
              ? 'bg-[var(--color-red-600)] text-white border-[var(--color-red-600)]'
              : 'bg-white text-[var(--color-charcoal-700)] border-[var(--color-charcoal-200)] hover:border-[var(--color-charcoal-400)]'
          }`}
        >
          todas
        </button>
        <span className="w-px h-5 bg-[var(--color-charcoal-200)]" aria-hidden />
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
        <label className="ml-auto inline-flex items-center gap-2 text-xs text-[var(--color-charcoal-500)]">
          Ordenar:
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="border border-[var(--color-charcoal-200)] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--color-charcoal-900)] bg-white focus:outline-none focus:border-[var(--color-red-600)]"
          >
            <option value="recent-upload">Upload recente</option>
            <option value="recent-used">Usadas recentemente</option>
          </select>
        </label>
      </div>

      {/* Filtro por tag — tags "galeria-*" alimentam as galerias públicas */}
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-charcoal-500)]">
            <TagIcon size={13} /> Tags:
          </span>
          {tags.map((t) => {
            const active = tagFilter === t.tag;
            const isGallery = GALLERY_TAG_SET.has(t.tag);
            return (
              <button
                key={t.tag}
                type="button"
                onClick={() => (active ? changeFolder(folder) : changeTagFilter(t.tag))}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold border transition-colors ${
                  active
                    ? 'bg-[var(--color-red-600)] text-white border-[var(--color-red-600)]'
                    : isGallery
                      ? 'bg-[var(--color-red-50)] text-[var(--color-red-700)] border-[var(--color-red-100)] hover:border-[var(--color-red-600)]'
                      : 'bg-white text-[var(--color-charcoal-700)] border-[var(--color-charcoal-200)] hover:border-[var(--color-charcoal-400)]'
                }`}
              >
                {t.tag} <span className="opacity-60">{t.count}</span>
              </button>
            );
          })}
          {tagFilter && (
            <button
              type="button"
              onClick={() => changeFolder(folder)}
              className="text-[11px] text-[var(--color-charcoal-500)] hover:text-[var(--color-charcoal-900)] underline underline-offset-2"
            >
              limpar filtro
            </button>
          )}
        </div>
      )}

      {/* Dropzone (só owner) */}
      {canManage && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? 'border-[var(--color-red-600)] bg-[var(--color-red-50)]'
              : 'border-[var(--color-charcoal-200)] bg-white hover:border-[var(--color-charcoal-400)]'
          }`}
        >
          <UploadCloud size={28} className="mx-auto mb-2 text-[var(--color-charcoal-400)]" />
          <p className="text-sm font-semibold text-[var(--color-charcoal-900)]">
            Arraste fotos OU pastas inteiras aqui
          </p>
          <p className="text-xs text-[var(--color-charcoal-500)] mt-1 max-w-md mx-auto">
            Pastas são organizadas automaticamente pelo nome (ex.:{' '}
            <span className="font-mono">escuna/foto.jpg</span> → álbum{' '}
            <strong>escuna</strong>). Arquivos soltos vão pra pasta{' '}
            <strong>{looseTarget}</strong>. Tudo é redimensionado pra 2560px e
            convertido pra WebP antes de subir.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl bg-[var(--color-red-600)] text-white text-xs font-semibold py-2 px-4 hover:bg-[var(--color-red-700)] transition-colors"
            >
              Escolher fotos
            </button>
            <button
              type="button"
              onClick={() => dirInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-charcoal-300)] text-[var(--color-charcoal-700)] text-xs font-semibold py-2 px-4 hover:bg-[var(--color-charcoal-50)] transition-colors"
            >
              <FolderUp size={14} /> Enviar pasta
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) handleLooseFiles(e.target.files);
              e.target.value = '';
            }}
          />
          {/* webkitdirectory: seleciona uma pasta inteira (com subpastas) */}
          <input
            ref={dirInputRef}
            type="file"
            multiple
            hidden
            // @ts-expect-error webkitdirectory é não-padrão mas suportado nos browsers alvo
            webkitdirectory=""
            onChange={(e) => {
              if (e.target.files) handleDirectoryInput(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {/* Barra de progresso geral do lote */}
      {batch && (
        <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-sm font-semibold text-[var(--color-charcoal-900)]">
              {batch.done >= batch.total ? (
                <span className="text-emerald-700">Concluído ✓</span>
              ) : (
                <>
                  Enviando {batch.done + 1} de {batch.total} foto{batch.total === 1 ? '' : 's'}…
                </>
              )}
            </p>
            <p className="text-xs font-bold text-[var(--color-charcoal-500)] tabular-nums">
              {Math.round((batch.done / batch.total) * 100)}%
            </p>
          </div>
          <div
            className="h-2 rounded-full bg-[var(--color-charcoal-100)] overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={batch.total}
            aria-valuenow={batch.done}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                batch.done >= batch.total ? 'bg-emerald-500' : 'bg-[var(--color-red-600)]'
              }`}
              style={{ width: `${Math.max(3, (batch.done / batch.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Progresso de uploads */}
      {uploads.length > 0 && (
        <ul className="space-y-1 max-h-48 overflow-y-auto">
          {uploads.map((u) => (
            <li key={u.key} className="flex items-center gap-2 text-xs">
              {u.status === 'done' ? (
                <span className="text-emerald-600 font-bold">✓</span>
              ) : u.status === 'error' ? (
                <span className="text-[var(--color-red-600)] font-bold">✕</span>
              ) : (
                <Loader2 size={12} className="animate-spin text-[var(--color-charcoal-400)]" />
              )}
              <span className="rounded bg-[var(--color-charcoal-100)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-charcoal-600)]">
                {u.folder}
              </span>
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
          {canManage &&
            (showTagInput ? (
              <span className="inline-flex items-center gap-1.5">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyTagToSelection()}
                  placeholder="tag (ex: galeria-home)"
                  list="tag-suggestions"
                  autoFocus
                  className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs text-white placeholder:text-white/40 w-44 focus:outline-none focus:border-white/50"
                />
                <datalist id="tag-suggestions">
                  {Array.from(new Set([...SUGGESTED_TAGS, ...tags.map((t) => t.tag)])).map(
                    (t) => (
                      <option key={t} value={t} />
                    )
                  )}
                </datalist>
                <button
                  type="button"
                  onClick={applyTagToSelection}
                  disabled={pending}
                  className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 disabled:opacity-50"
                >
                  Aplicar
                </button>
                <button
                  type="button"
                  onClick={() => setShowTagInput(false)}
                  className="text-xs text-white/50 hover:text-white"
                >
                  ✕
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowTagInput(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white"
              >
                <TagIcon size={13} /> Taguear
              </button>
            ))}
          {canManage && tagFilter && (
            <button
              type="button"
              onClick={removeTagFromSelection}
              disabled={pending}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 disabled:opacity-50"
            >
              <TagIcon size={13} /> Remover tag &ldquo;{tagFilter}&rdquo;
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
      ) : displayImages.length === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--color-charcoal-500)]">
          {folder === ALL ? (
            <>Nenhuma imagem na biblioteca ainda.</>
          ) : (
            <>
              Nenhuma imagem na pasta <strong>{folder}</strong> ainda.
            </>
          )}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {displayImages.map((img) => {
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
                  {(folder === ALL || tagFilter) && (
                    <span className="absolute top-2 right-2 rounded-full bg-black/60 text-white text-[9px] font-bold px-2 py-0.5">
                      {img.folder}
                    </span>
                  )}
                  {img.tags.length > 0 && (
                    <span className="absolute bottom-2 left-2 flex flex-wrap gap-1 max-w-[calc(100%-1rem)]">
                      {img.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className={`rounded-full text-[9px] font-bold px-1.5 py-0.5 ${
                            GALLERY_TAG_SET.has(t)
                              ? 'bg-[var(--color-red-600)]/90 text-white'
                              : 'bg-black/60 text-white'
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                      {img.tags.length > 2 && (
                        <span className="rounded-full bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5">
                          +{img.tags.length - 2}
                        </span>
                      )}
                    </span>
                  )}
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
