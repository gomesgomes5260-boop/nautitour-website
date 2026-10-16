'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser, isOwnerUser } from '@/lib/admin';
import type { Database } from '@/lib/supabase/database.types';

type SocialRede = Database['public']['Enums']['social_rede'];
type SocialStatus = Database['public']['Enums']['social_status'];
type SocialTipo = Database['public']['Enums']['social_tipo'];

const BUCKET = 'social-posts';
const REDES: SocialRede[] = [
  'instagram_feed', 'instagram_story', 'instagram_reels', 'facebook',
  'tiktok', 'youtube_shorts', 'whatsapp_status', 'meta_ads',
];
const TIPOS: SocialTipo[] = ['imagem', 'video', 'carrossel'];
const STATUSES: SocialStatus[] = ['rascunho', 'aprovado', 'publicado', 'descartado'];
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const MIME_OK = ['image/png', 'image/jpeg', 'image/webp', 'video/mp4'];
const MAX_UPLOAD = 100 * 1024 * 1024; // = file_size_limit do bucket

async function requireAdminId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/posts');
  if (!(await isAdminUser(user.id))) throw new Error('Sem permissão');
  return user.id;
}

async function requireOwnerId(): Promise<string> {
  const userId = await requireAdminId();
  if (!(await isOwnerUser(userId))) throw new Error('Só o owner pode fazer isso');
  return userId;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

type PostFields = {
  slug: string;
  titulo: string;
  pilar: string;
  persona: string;
  rede: string;
  formato: string;
  tipo: string;
  legenda: string;
  hashtags: string; // separadas por espaço/linha; '#' opcional
  ctaTexto: string;
  ctaUrl: string;
  agendadoPara: string; // datetime-local (BRT) ou ''
  lote: string;
  estrategiaMd: string;
};

type ParsedRow = {
  slug: string;
  titulo: string;
  pilar: string | null;
  persona: string | null;
  rede: SocialRede;
  formato: string | null;
  tipo: SocialTipo;
  legenda: string;
  hashtags: string[];
  cta_texto: string | null;
  cta_url: string | null;
  agendado_para: string | null;
  lote: string | null;
  estrategia_md: string;
};
type Parsed = { error: string; row?: undefined } | { error?: undefined; row: ParsedRow };

function parseFields(f: PostFields): Parsed {
  const slug = f.slug.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) return { error: 'Slug inválido (minúsculas, números e hífens, até 80).' };
  if (!f.titulo.trim()) return { error: 'Título é obrigatório.' };
  const rede = f.rede as SocialRede;
  if (!REDES.includes(rede)) return { error: 'Rede inválida.' };
  const tipo = f.tipo as SocialTipo;
  if (!TIPOS.includes(tipo)) return { error: 'Tipo inválido.' };
  const hashtags = f.hashtags
    .split(/[\s,]+/)
    .map((h) => h.trim())
    .filter(Boolean)
    .map((h) => (h.startsWith('#') ? h : `#${h}`));
  // datetime-local sem fuso → Búzios é UTC-3 fixo (regra do CLAUDE.md)
  const agendado = f.agendadoPara ? new Date(`${f.agendadoPara}:00-03:00`).toISOString() : null;
  return {
    row: {
      slug,
      titulo: f.titulo.trim(),
      pilar: f.pilar.trim() || null,
      persona: f.persona.trim() || null,
      rede,
      formato: f.formato.trim() || null,
      tipo,
      legenda: f.legenda,
      hashtags,
      cta_texto: f.ctaTexto.trim() || null,
      cta_url: f.ctaUrl.trim() || null,
      agendado_para: agendado,
      lote: f.lote.trim() || null,
      estrategia_md: f.estrategiaMd,
    },
  };
}

export async function createPostAction(f: PostFields): Promise<ActionResult & { id?: string }> {
  const userId = await requireAdminId();
  const parsed = parseFields(f);
  if (parsed.error !== undefined) return { ok: false, error: parsed.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('social_posts')
    .insert({ ...parsed.row, created_by: userId })
    .select('id')
    .single();
  if (error) {
    console.error('[createPostAction]', error);
    return { ok: false, error: error.code === '23505' ? 'Já existe uma peça com esse slug.' : error.message };
  }
  revalidatePath('/admin/posts');
  return { ok: true, id: data.id };
}

export async function updatePostAction(id: string, f: PostFields): Promise<ActionResult> {
  await requireAdminId();
  const parsed = parseFields(f);
  if (parsed.error !== undefined) return { ok: false, error: parsed.error };

  const admin = createAdminClient();
  const { error } = await admin.from('social_posts').update(parsed.row).eq('id', id);
  if (error) {
    console.error('[updatePostAction]', error);
    return { ok: false, error: error.code === '23505' ? 'Já existe uma peça com esse slug.' : error.message };
  }
  revalidatePath('/admin/posts');
  revalidatePath(`/admin/posts/${id}`);
  return { ok: true };
}

// Mudança de status é gate de OWNER (decisão do dono; isOwnerUser existente).
export async function setStatusAction(id: string, status: string): Promise<ActionResult> {
  await requireOwnerId();
  if (!STATUSES.includes(status as SocialStatus)) return { ok: false, error: 'Status inválido.' };

  const admin = createAdminClient();
  const patch: { status: SocialStatus; publicado_em?: string } = { status: status as SocialStatus };
  if (status === 'publicado') patch.publicado_em = new Date().toISOString();
  const { error } = await admin.from('social_posts').update(patch).eq('id', id);
  if (error) {
    console.error('[setStatusAction]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/posts');
  revalidatePath(`/admin/posts/${id}`);
  return { ok: true };
}

export async function deletePostAction(id: string): Promise<ActionResult> {
  await requireOwnerId();
  const admin = createAdminClient();

  const { data: assets } = await admin
    .from('social_post_assets')
    .select('storage_path')
    .eq('post_id', id);
  const paths = (assets ?? []).map((a) => a.storage_path);
  if (paths.length > 0) {
    const { error: stErr } = await admin.storage.from(BUCKET).remove(paths);
    if (stErr) console.error('[deletePostAction] storage', stErr); // segue: linha some, arquivo órfão é inofensivo
  }
  const { error } = await admin.from('social_posts').delete().eq('id', id);
  if (error) {
    console.error('[deletePostAction]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/posts');
  return { ok: true };
}

function pngDims(buf: Buffer): { largura: number | null; altura: number | null } {
  if (buf.length > 24 && buf.readUInt32BE(12) === 0x49484452) {
    return { largura: buf.readUInt32BE(16), altura: buf.readUInt32BE(20) };
  }
  return { largura: null, altura: null };
}

export async function uploadAssetsAction(postId: string, formData: FormData): Promise<ActionResult> {
  await requireAdminId();
  const admin = createAdminClient();

  const { data: post } = await admin
    .from('social_posts')
    .select('id, formato')
    .eq('id', postId)
    .maybeSingle();
  if (!post) return { ok: false, error: 'Peça não encontrada.' };

  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { ok: false, error: 'Nenhum arquivo selecionado.' };

  const { data: last } = await admin
    .from('social_post_assets')
    .select('ordem')
    .eq('post_id', postId)
    .order('ordem', { ascending: false })
    .limit(1);
  let ordem = (last?.[0]?.ordem ?? -1) + 1;

  for (const file of files) {
    if (!MIME_OK.includes(file.type)) return { ok: false, error: `Formato não aceito: ${file.name} (PNG, JPG, WebP ou MP4).` };
    if (file.size > MAX_UPLOAD) return { ok: false, error: `${file.name} passa de 100 MB.` };

    const buffer = Buffer.from(await file.arrayBuffer());
    const seguro = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(-80);
    const path = `uploads/${postId}/${Date.now()}-${seguro}`;
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (upErr) {
      console.error('[uploadAssetsAction] upload', upErr);
      return { ok: false, error: `Falha ao subir ${file.name}: ${upErr.message}` };
    }
    const dims = file.type === 'image/png' ? pngDims(buffer) : { largura: null, altura: null };
    const { error: insErr } = await admin.from('social_post_assets').insert({
      post_id: postId,
      storage_path: path,
      formato: post.formato,
      ordem: ordem++,
      mime: file.type,
      ...dims,
    });
    if (insErr) {
      console.error('[uploadAssetsAction] insert', insErr);
      return { ok: false, error: insErr.message };
    }
  }
  revalidatePath(`/admin/posts/${postId}`);
  revalidatePath('/admin/posts');
  return { ok: true };
}

export async function deleteAssetAction(assetId: string): Promise<ActionResult> {
  await requireAdminId();
  const admin = createAdminClient();
  const { data: asset } = await admin
    .from('social_post_assets')
    .select('id, post_id, storage_path')
    .eq('id', assetId)
    .maybeSingle();
  if (!asset) return { ok: false, error: 'Arquivo não encontrado.' };

  const { error } = await admin.from('social_post_assets').delete().eq('id', assetId);
  if (error) return { ok: false, error: error.message };
  const { error: stErr } = await admin.storage.from(BUCKET).remove([asset.storage_path]);
  if (stErr) console.error('[deleteAssetAction] storage', stErr);
  revalidatePath(`/admin/posts/${asset.post_id}`);
  revalidatePath('/admin/posts');
  return { ok: true };
}

// Estratégia geral do canal — edição é gate de OWNER.
export async function saveStrategyAction(conteudoMd: string): Promise<ActionResult> {
  const userId = await requireOwnerId();
  const admin = createAdminClient();
  const { error } = await admin
    .from('social_strategy')
    .upsert({ id: 1, conteudo_md: conteudoMd, updated_at: new Date().toISOString(), updated_by: userId });
  if (error) {
    console.error('[saveStrategyAction]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/posts/estrategia');
  return { ok: true };
}
