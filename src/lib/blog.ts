// Helpers do blog. Reads públicos rodam pela RLS de leitura — `status = 'published'`
// + `published_at <= now()`. Writes (insert/update/delete) acontecem em server
// actions com admin client (PR 2).

import type { Database, Tables } from '@/lib/supabase/database.types';

export type BlogPostStatus = 'draft' | 'published';

export type BlogCategoryRow = Tables<'blog_categories'>;
export type BlogPostRow = Tables<'blog_posts'>;

// Linha pública: só posts published com cover, então cover_image_url é garantido
// (via CHECK constraint). Estreita o tipo pra eliminar `| null` no consumo.
export type PublicBlogPost = Omit<BlogPostRow, 'cover_image_url' | 'published_at'> & {
  cover_image_url: string;
  published_at: string;
};

export const BLOG_IMAGES_BUCKET = 'blog-images' as const;

export const BLOG_LIST_DEFAULT_PAGE_SIZE = 12;

// Slugify pt-BR: remove diacríticos, transforma em kebab-case, mantém ascii
// alfanumérico + hífen. Não trunca — caller deve aplicar limite se quiser.
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // descarta caracteres não-alfanuméricos
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Resolve uma URL de capa. Aceita:
//   - URL absoluta (ex: https://...)  → retorna como veio
//   - path bruto no bucket (ex: posts/abc.jpg) → monta URL pública do Supabase
export function resolveBlogImageUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return pathOrUrl; // dev sem env — retorna cru pra não quebrar
  const path = pathOrUrl.replace(/^\/+/, '');
  return `${base}/storage/v1/object/public/${BLOG_IMAGES_BUCKET}/${path}`;
}

// Extrai um excerpt textual simples de um content TipTap (ProseMirror JSON).
// Aceita tanto { type:'doc', content:[...] } quanto array cru de blocos
// (legado de tentativa anterior com BlockNote). Percorre recursivamente
// concatenando node.text. Não renderiza formatação — só preview pro card
// e meta description.
type ProseMirrorNodeLike = {
  type?: string;
  text?: string;
  content?: ProseMirrorNodeLike[];
};

export function deriveExcerpt(
  content: Database['public']['Tables']['blog_posts']['Row']['content'],
  maxLen: number = 200
): string {
  let nodes: ProseMirrorNodeLike[] = [];
  if (Array.isArray(content)) {
    nodes = content as ProseMirrorNodeLike[];
  } else if (
    content &&
    typeof content === 'object' &&
    (content as ProseMirrorNodeLike).type === 'doc' &&
    Array.isArray((content as ProseMirrorNodeLike).content)
  ) {
    nodes = (content as ProseMirrorNodeLike).content!;
  } else {
    return '';
  }

  const out: string[] = [];
  const visit = (node: ProseMirrorNodeLike): void => {
    if (out.join(' ').length >= maxLen) return;
    if (!node || typeof node !== 'object') return;
    if (typeof node.text === 'string') out.push(node.text);
    if (Array.isArray(node.content)) {
      for (const child of node.content) visit(child);
    }
  };
  for (const node of nodes) visit(node);

  const joined = out.join(' ').replace(/\s+/g, ' ').trim();
  if (joined.length <= maxLen) return joined;
  // Corta na última palavra completa pra não cortar no meio
  const slice = joined.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.6 ? slice.slice(0, lastSpace) : slice) + '…';
}

// Garante que um candidato `narrowed` representa um post público — usado depois
// da query pra estreitar o tipo no consumo.
export function asPublicBlogPost(row: BlogPostRow): PublicBlogPost | null {
  if (row.status !== 'published') return null;
  if (!row.cover_image_url || !row.published_at) return null;
  return row as PublicBlogPost;
}

// ---------------------------------------------------------------------------
// Reads públicos (passam pelo RLS — só retornam o que `blog_posts_public_select`
// permite ver). Use em RSC com `createClient` de `@/lib/supabase/server`.
// ---------------------------------------------------------------------------

import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<Database>;

export type ListPostsOptions = {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
};

export type ListPostsResult = {
  posts: PublicBlogPost[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listPublishedPosts(
  supabase: Client,
  opts: ListPostsOptions = {}
): Promise<ListPostsResult> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? BLOG_LIST_DEFAULT_PAGE_SIZE));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let categoryId: string | null = null;
  if (opts.categorySlug) {
    const { data: cat, error: catErr } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('slug', opts.categorySlug)
      .maybeSingle();
    if (catErr) throw catErr;
    if (!cat) return { posts: [], total: 0, page, pageSize };
    categoryId = cat.id;
  }

  let query = supabase
    .from('blog_posts')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(from, to);

  if (categoryId) query = query.eq('category_id', categoryId);

  const { data, count, error } = await query;
  if (error) throw error;

  const posts = (data ?? [])
    .map(asPublicBlogPost)
    .filter((p): p is PublicBlogPost => p !== null);

  return { posts, total: count ?? 0, page, pageSize };
}

export async function getPostBySlug(
  supabase: Client,
  slug: string
): Promise<PublicBlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return asPublicBlogPost(data);
}

export async function listCategories(supabase: Client): Promise<BlogCategoryRow[]> {
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
