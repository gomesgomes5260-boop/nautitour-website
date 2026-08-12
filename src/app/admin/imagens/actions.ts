'use server';

import { randomUUID } from 'crypto';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser, isOwnerUser } from '@/lib/admin';
import { sanitizeTag, TAG_RE } from '@/lib/image-tags';

const SITE_IMAGES_BUCKET = 'site-images';

// Bucket aceita até 15 MiB, mas o uploader do browser já comprime pra WebP
// ~2560px — este limite é só a rede de segurança do fallback (original).
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const EXT_FROM_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

const FOLDER_RE = /^[a-z0-9][a-z0-9-]{0,49}$/;
const PATH_RE = /^[a-z0-9][a-z0-9-]*\/[^/]+$/;

async function requireAdminId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/imagens');
  if (!(await isAdminUser(user.id))) throw new Error('Sem permissão');
  return user.id;
}

async function requireOwnerId(): Promise<string> {
  const userId = await requireAdminId();
  if (!(await isOwnerUser(userId))) {
    throw new Error('Apenas o admin master pode alterar a biblioteca');
  }
  return userId;
}

// Sentinela da aba "Todas" — lista todas as pastas do bucket de uma vez.
const ALL_FOLDERS = '__all__';

export type SiteImage = {
  path: string;
  name: string;
  folder: string;
  url: string;
  sizeBytes: number | null;
  createdAt: string | null;
  lastUsedAt: string | null;
  tags: string[];
};

type AdminClient = ReturnType<typeof createAdminClient>;

async function listFolderImages(admin: AdminClient, folder: string): Promise<SiteImage[]> {
  const { data, error } = await admin.storage
    .from(SITE_IMAGES_BUCKET)
    .list(folder, {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' },
    });
  if (error) throw new Error(error.message);

  return (data ?? [])
    // Entradas com id null são "subpastas" — só arquivos aqui.
    .filter((item) => item.id != null)
    .map((item) => {
      const path = `${folder}/${item.name}`;
      const { data: pub } = admin.storage.from(SITE_IMAGES_BUCKET).getPublicUrl(path);
      const meta = (item.metadata ?? {}) as { size?: number };
      return {
        path,
        name: item.name,
        folder,
        url: pub.publicUrl,
        sizeBytes: typeof meta.size === 'number' ? meta.size : null,
        createdAt: item.created_at ?? null,
        lastUsedAt: null,
        tags: [],
      };
    });
}

/** Anexa as tags de cada imagem — 1 query em lote (padrão do site_image_usage). */
async function attachTags(admin: AdminClient, images: SiteImage[]): Promise<SiteImage[]> {
  if (images.length === 0) return images;
  const { data } = await admin
    .from('site_image_tags')
    .select('path, tag')
    .in('path', images.map((i) => i.path));
  if (!data || data.length === 0) return images;
  const byPath = new Map<string, string[]>();
  for (const row of data) {
    const list = byPath.get(row.path) ?? [];
    list.push(row.tag);
    byPath.set(row.path, list);
  }
  return images.map((img) => ({
    ...img,
    tags: (byPath.get(img.path) ?? []).sort(),
  }));
}

export async function listSiteImagesAction(
  folder: string
): Promise<{ ok: true; images: SiteImage[] } | { ok: false; error: string }> {
  const isAll = folder === ALL_FOLDERS;
  if (!isAll && !FOLDER_RE.test(folder)) return { ok: false, error: 'Pasta inválida' };
  await requireAdminId();

  const admin = createAdminClient();
  let images: SiteImage[];
  try {
    if (isAll) {
      const { data: rootItems, error } = await admin.storage
        .from(SITE_IMAGES_BUCKET)
        .list('', { limit: 200 });
      if (error) throw new Error(error.message);
      const folders = (rootItems ?? [])
        .filter((item) => item.id == null)
        .map((item) => item.name)
        .filter((name) => FOLDER_RE.test(name));
      const perFolder = await Promise.all(
        folders.map((f) => listFolderImages(admin, f))
      );
      images = perFolder
        .flat()
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    } else {
      images = await listFolderImages(admin, folder);
    }
  } catch (e) {
    console.error('[listSiteImagesAction]', e);
    return { ok: false, error: e instanceof Error ? e.message : 'Falha ao listar' };
  }

  // Anexa last_used_at (ordenação "usadas recentemente") — 1 query em lote.
  if (images.length > 0) {
    const { data: usage } = await admin
      .from('site_image_usage')
      .select('path, last_used_at')
      .in('path', images.map((i) => i.path));
    if (usage && usage.length > 0) {
      const byPath = new Map(usage.map((u) => [u.path, u.last_used_at]));
      images = images.map((img) => ({
        ...img,
        lastUsedAt: byPath.get(img.path) ?? null,
      }));
    }
  }

  images = await attachTags(admin, images);

  return { ok: true, images };
}

export type TagCount = { tag: string; count: number };

export async function listTagsAction(): Promise<
  { ok: true; tags: TagCount[] } | { ok: false; error: string }
> {
  await requireAdminId();
  const admin = createAdminClient();
  // Volume pequeno (poucos milhares de linhas no máximo) — agrega em JS.
  const { data, error } = await admin.from('site_image_tags').select('tag');
  if (error) {
    console.error('[listTagsAction]', error);
    return { ok: false, error: error.message };
  }
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.tag, (counts.get(row.tag) ?? 0) + 1);
  }
  const tags = Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
  return { ok: true, tags };
}

export async function listImagesByTagAction(
  tag: string
): Promise<{ ok: true; images: SiteImage[] } | { ok: false; error: string }> {
  if (typeof tag !== 'string' || !TAG_RE.test(tag)) {
    return { ok: false, error: 'Tag inválida' };
  }
  await requireAdminId();
  const admin = createAdminClient();
  // storage.list() não busca por path arbitrário — monta a SiteImage direto
  // do path (publicUrl é determinístico); sem metadata de tamanho/data.
  const { data, error } = await admin
    .from('site_image_tags')
    .select('path, tagged_at')
    .eq('tag', tag)
    .order('tagged_at', { ascending: true })
    .order('path', { ascending: true })
    .limit(1000);
  if (error) {
    console.error('[listImagesByTagAction]', error);
    return { ok: false, error: error.message };
  }
  let images: SiteImage[] = (data ?? []).map((row) => {
    const { data: pub } = admin.storage.from(SITE_IMAGES_BUCKET).getPublicUrl(row.path);
    const [folder, ...rest] = row.path.split('/');
    return {
      path: row.path,
      name: rest.join('/'),
      folder,
      url: pub.publicUrl,
      sizeBytes: null,
      createdAt: row.tagged_at,
      lastUsedAt: null,
      tags: [],
    };
  });
  images = await attachTags(admin, images);
  return { ok: true, images };
}

export async function tagImagesAction(
  paths: string[],
  tagRaw: string
): Promise<{ ok: true; tag: string; tagged: number } | { ok: false; error: string }> {
  await requireOwnerId();

  const tag = sanitizeTag(typeof tagRaw === 'string' ? tagRaw : '');
  if (!tag) return { ok: false, error: 'Tag inválida (letras minúsculas, números e hífen)' };
  const clean = (paths ?? []).filter((p) => typeof p === 'string' && PATH_RE.test(p));
  if (clean.length === 0) return { ok: false, error: 'Nada selecionado' };
  if (clean.length > 200) return { ok: false, error: 'Máximo 200 por vez' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('site_image_tags')
    .upsert(clean.map((path) => ({ path, tag })), {
      onConflict: 'path,tag',
      ignoreDuplicates: true,
    });
  if (error) {
    console.error('[tagImagesAction]', error);
    return { ok: false, error: error.message };
  }
  return { ok: true, tag, tagged: clean.length };
}

export async function untagImagesAction(
  paths: string[],
  tag: string
): Promise<{ ok: true; removed: number } | { ok: false; error: string }> {
  await requireOwnerId();

  if (typeof tag !== 'string' || !TAG_RE.test(tag)) {
    return { ok: false, error: 'Tag inválida' };
  }
  const clean = (paths ?? []).filter((p) => typeof p === 'string' && PATH_RE.test(p));
  if (clean.length === 0) return { ok: false, error: 'Nada selecionado' };
  if (clean.length > 200) return { ok: false, error: 'Máximo 200 por vez' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('site_image_tags')
    .delete()
    .eq('tag', tag)
    .in('path', clean);
  if (error) {
    console.error('[untagImagesAction]', error);
    return { ok: false, error: error.message };
  }
  return { ok: true, removed: clean.length };
}

/**
 * Marca uma imagem como "usada" (URL copiada). Fire-and-forget no client —
 * nunca bloqueia o clipboard.
 */
export async function markImageUsedAction(
  path: string
): Promise<{ ok: boolean }> {
  if (typeof path !== 'string' || !/^[a-z0-9][a-z0-9-]*\/[^/]+$/.test(path)) {
    return { ok: false };
  }
  await requireAdminId();

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('site_image_usage')
    .select('times_used')
    .eq('path', path)
    .maybeSingle();
  const { error } = await admin.from('site_image_usage').upsert({
    path,
    last_used_at: new Date().toISOString(),
    times_used: (existing?.times_used ?? 0) + 1,
  });
  if (error) {
    console.error('[markImageUsedAction]', error);
    return { ok: false };
  }
  return { ok: true };
}

export async function listFoldersAction(): Promise<
  { ok: true; folders: string[] } | { ok: false; error: string }
> {
  await requireAdminId();
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(SITE_IMAGES_BUCKET)
    .list('', { limit: 200 });
  if (error) {
    console.error('[listFoldersAction]', error);
    return { ok: false, error: error.message };
  }
  const folders = (data ?? [])
    .filter((item) => item.id == null)
    .map((item) => item.name)
    .filter((name) => FOLDER_RE.test(name));
  return { ok: true, folders };
}

export async function uploadSiteImageAction(
  formData: FormData
): Promise<{ ok: true; image: SiteImage } | { ok: false; error: string }> {
  await requireOwnerId();

  const file = formData.get('file');
  const folderRaw = formData.get('folder');
  const folder = typeof folderRaw === 'string' ? folderRaw.trim().toLowerCase() : '';

  if (!FOLDER_RE.test(folder)) {
    return { ok: false, error: 'Pasta inválida (use letras minúsculas, números e hífen)' };
  }
  if (!(file instanceof File)) return { ok: false, error: 'Arquivo ausente' };
  if (file.size === 0) return { ok: false, error: 'Arquivo vazio' };
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Arquivo muito grande (máx 15 MB)' };
  }
  if (!ALLOWED_IMAGE_MIMES.has(file.type)) {
    return { ok: false, error: 'Formato não suportado (JPG, PNG, WEBP ou AVIF)' };
  }

  const ext = EXT_FROM_MIME[file.type] ?? '.jpg';
  // Prefixo do nome original (sanitizado) ajuda a identificar a foto no grid.
  const base = (file.name.replace(/\.[^.]+$/, '') || 'foto')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const path = `${folder}/${base || 'foto'}-${randomUUID().slice(0, 8)}${ext}`;

  const admin = createAdminClient();
  const buffer = await file.arrayBuffer();
  const { error } = await admin.storage
    .from(SITE_IMAGES_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    });
  if (error) {
    console.error('[uploadSiteImageAction]', error);
    return { ok: false, error: error.message };
  }

  const { data: pub } = admin.storage.from(SITE_IMAGES_BUCKET).getPublicUrl(path);
  return {
    ok: true,
    image: {
      path,
      name: path.split('/').pop() ?? path,
      folder,
      url: pub.publicUrl,
      sizeBytes: file.size,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      tags: [],
    },
  };
}

export async function deleteSiteImagesAction(
  paths: string[]
): Promise<{ ok: true; deleted: number } | { ok: false; error: string }> {
  await requireOwnerId();

  const clean = (paths ?? []).filter(
    (p) => typeof p === 'string' && PATH_RE.test(p)
  );
  if (clean.length === 0) return { ok: false, error: 'Nada selecionado' };
  if (clean.length > 200) return { ok: false, error: 'Máximo 200 por vez' };

  const admin = createAdminClient();
  const { error } = await admin.storage.from(SITE_IMAGES_BUCKET).remove(clean);
  if (error) {
    console.error('[deleteSiteImagesAction]', error);
    return { ok: false, error: error.message };
  }
  // Limpa as tags junto — path órfão viraria 404 nas galerias públicas.
  await admin.from('site_image_tags').delete().in('path', clean);
  return { ok: true, deleted: clean.length };
}
