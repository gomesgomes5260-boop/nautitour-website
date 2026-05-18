'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin';
import { slugify, BLOG_IMAGES_BUCKET } from '@/lib/blog';
import type { TablesUpdate } from '@/lib/supabase/database.types';

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MiB

const EXT_FROM_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

type Result<T = unknown> =
  | (T extends Record<string, unknown> ? { ok: true } & T : { ok: true })
  | { ok: false; error: string };

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/blog');
  if (!(await isAdminUser(user.id))) {
    throw new Error('Sem permissão');
  }
  return user;
}

// ---------------------------------------------------------------------------
// Upload de imagem (cover + inline no editor)
// ---------------------------------------------------------------------------
export async function uploadBlogImageAction(
  formData: FormData
): Promise<Result<{ url: string; path: string }>> {
  await requireAdminUser();
  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'Arquivo ausente.' };
  if (file.size === 0) return { ok: false, error: 'Arquivo vazio.' };
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Arquivo muito grande (máx 10 MB).' };
  }
  if (!ALLOWED_IMAGE_MIMES.has(file.type)) {
    return { ok: false, error: 'Formato não suportado (use JPG, PNG, WEBP ou AVIF).' };
  }

  const ext = EXT_FROM_MIME[file.type] ?? '.jpg';
  const path = `posts/${randomUUID()}${ext}`;

  const admin = createAdminClient();
  const buffer = await file.arrayBuffer();
  const { error } = await admin.storage
    .from(BLOG_IMAGES_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    });
  if (error) {
    console.error('[uploadBlogImageAction]', error);
    return { ok: false, error: error.message };
  }

  const { data: pub } = admin.storage.from(BLOG_IMAGES_BUCKET).getPublicUrl(path);
  return { ok: true, url: pub.publicUrl, path };
}

// ---------------------------------------------------------------------------
// Posts CRUD
// ---------------------------------------------------------------------------

type PostStatus = 'draft' | 'published';

export type PostInput = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: unknown;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  categoryId: string | null;
  status: PostStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  publishedAt: string | null; // ISO ou null
};

function validatePostInput(input: PostInput): string | null {
  if (!input.title || input.title.trim().length < 3) {
    return 'Título precisa ter ao menos 3 caracteres.';
  }
  if (!input.slug || !/^[a-z0-9-]+$/.test(input.slug)) {
    return 'Slug inválido (só letras minúsculas, números e hífens).';
  }
  if (input.status !== 'draft' && input.status !== 'published') {
    return 'Status inválido.';
  }
  if (input.status === 'published') {
    if (!input.coverImageUrl) return 'Imagem de capa é obrigatória pra publicar.';
    if (!input.publishedAt) return 'Data de publicação é obrigatória pra publicar.';
  }
  if (input.seoDescription && input.seoDescription.length > 320) {
    return 'SEO description muito longa (máx 320).';
  }
  return null;
}

export async function createPostAction(
  input: PostInput
): Promise<Result<{ id: string }>> {
  const user = await requireAdminUser();
  const err = validatePostInput(input);
  if (err) return { ok: false, error: err };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('blog_posts')
    .insert({
      title: input.title.trim(),
      slug: input.slug.trim(),
      excerpt: input.excerpt?.trim() || null,
      content: (input.content ?? []) as never,
      cover_image_url: input.coverImageUrl,
      cover_image_alt: input.coverImageAlt?.trim() || null,
      category_id: input.categoryId,
      author_id: user.id,
      status: input.status,
      seo_title: input.seoTitle?.trim() || null,
      seo_description: input.seoDescription?.trim() || null,
      og_image_url: input.ogImageUrl,
      published_at: input.publishedAt,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[createPostAction]', error);
    if (error.code === '23505') return { ok: false, error: 'Slug já está em uso.' };
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  return { ok: true, id: data.id };
}

export async function updatePostAction(
  id: string,
  input: PostInput
): Promise<Result> {
  if (!id) return { ok: false, error: 'ID inválido.' };
  await requireAdminUser();
  const err = validatePostInput(input);
  if (err) return { ok: false, error: err };

  const admin = createAdminClient();
  const { error } = await admin
    .from('blog_posts')
    .update({
      title: input.title.trim(),
      slug: input.slug.trim(),
      excerpt: input.excerpt?.trim() || null,
      content: (input.content ?? []) as never,
      cover_image_url: input.coverImageUrl,
      cover_image_alt: input.coverImageAlt?.trim() || null,
      category_id: input.categoryId,
      status: input.status,
      seo_title: input.seoTitle?.trim() || null,
      seo_description: input.seoDescription?.trim() || null,
      og_image_url: input.ogImageUrl,
      published_at: input.publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('[updatePostAction]', error);
    if (error.code === '23505') return { ok: false, error: 'Slug já está em uso.' };
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin/blog');
  revalidatePath(`/admin/blog/${id}/editar`);
  revalidatePath('/blog');
  revalidatePath(`/blog/${input.slug}`);
  return { ok: true };
}

export async function deletePostAction(id: string): Promise<Result> {
  if (!id) return { ok: false, error: 'ID inválido.' };
  await requireAdminUser();

  const admin = createAdminClient();
  const { error } = await admin.from('blog_posts').delete().eq('id', id);
  if (error) {
    console.error('[deletePostAction]', error);
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Categories CRUD
// ---------------------------------------------------------------------------

export async function createCategoryAction(input: {
  name: string;
  slug?: string;
  description?: string | null;
}): Promise<Result<{ id: string }>> {
  await requireAdminUser();
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: 'Nome muito curto.' };
  const slug = (input.slug?.trim() || slugify(name)).toLowerCase();
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { ok: false, error: 'Slug inválido.' };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('blog_categories')
    .insert({
      name,
      slug,
      description: input.description?.trim() || null,
    })
    .select('id')
    .single();
  if (error) {
    console.error('[createCategoryAction]', error);
    if (error.code === '23505') return { ok: false, error: 'Slug já está em uso.' };
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/blog/categorias');
  revalidatePath('/admin/blog');
  return { ok: true, id: data.id };
}

export async function updateCategoryAction(
  id: string,
  input: { name?: string; slug?: string; description?: string | null }
): Promise<Result> {
  if (!id) return { ok: false, error: 'ID inválido.' };
  await requireAdminUser();
  const patch: TablesUpdate<'blog_categories'> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < 2) return { ok: false, error: 'Nome muito curto.' };
    patch.name = name;
  }
  if (input.slug !== undefined) {
    const slug = input.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(slug)) return { ok: false, error: 'Slug inválido.' };
    patch.slug = slug;
  }
  if (input.description !== undefined) {
    patch.description = input.description?.trim() || null;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('blog_categories')
    .update(patch)
    .eq('id', id);
  if (error) {
    console.error('[updateCategoryAction]', error);
    if (error.code === '23505') return { ok: false, error: 'Slug já está em uso.' };
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/blog/categorias');
  revalidatePath('/admin/blog');
  return { ok: true };
}

export async function deleteCategoryAction(id: string): Promise<Result> {
  if (!id) return { ok: false, error: 'ID inválido.' };
  await requireAdminUser();
  const admin = createAdminClient();
  // ON DELETE SET NULL na FK garante que posts não são apagados, só desassociados.
  const { error } = await admin.from('blog_categories').delete().eq('id', id);
  if (error) {
    console.error('[deleteCategoryAction]', error);
    return { ok: false, error: error.message };
  }
  revalidatePath('/admin/blog/categorias');
  revalidatePath('/admin/blog');
  return { ok: true };
}
