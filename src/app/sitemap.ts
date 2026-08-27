import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nautitour-website.vercel.app';

// Lê os posts publicados via admin client (bypassa RLS — só fields públicos
// e filtra status='published' explicitamente). Falha silenciosa em dev sem
// env vars: retorna lista vazia.
async function fetchBlogPosts(): Promise<
  { slug: string; updatedAt: string }[]
> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false });
    return (data ?? []).map((p) => ({
      slug: p.slug,
      updatedAt: p.updated_at,
    }));
  } catch (err) {
    console.error('[sitemap] failed to load blog posts', err);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const posts = await fetchBlogPosts();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${SITE_URL}/passeio-escuna`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/passeio-lancha`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/locacao-escuna`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    { url: `${SITE_URL}/sobre-nos`, lastModified: now, priority: 0.5 },
    { url: `${SITE_URL}/faq`, lastModified: now, priority: 0.5 },
    { url: `${SITE_URL}/contato`, lastModified: now, priority: 0.5 },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/politica-de-privacidade`,
      lastModified: now,
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/politica-de-cancelamento`,
      lastModified: now,
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/termos-de-uso`,
      lastModified: now,
      priority: 0.3,
    },
  ];

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...postEntries];
}
