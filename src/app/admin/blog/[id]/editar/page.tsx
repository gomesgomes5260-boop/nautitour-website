import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import PostForm, { type Category, type PostFormInitial } from '@/components/admin/blog/PostForm';

export const dynamic = 'force-dynamic';

export default async function AdminBlogEditarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: post }, { data: cats }] = await Promise.all([
    admin
      .from('blog_posts')
      .select(
        `id, title, slug, excerpt, content, cover_image_url, cover_image_alt,
         category_id, status, seo_title, seo_description, og_image_url, published_at`
      )
      .eq('id', id)
      .maybeSingle(),
    admin
      .from('blog_categories')
      .select('id, name')
      .order('name', { ascending: true }),
  ]);

  if (!post) notFound();

  const categories: Category[] = (cats ?? []).map((c) => ({ id: c.id, name: c.name }));

  const initial: PostFormInitial = {
    id: post.id,
    title: post.title ?? '',
    slug: post.slug ?? '',
    excerpt: post.excerpt ?? '',
    content: post.content ?? [],
    coverImageUrl: post.cover_image_url,
    coverImageAlt: post.cover_image_alt ?? '',
    categoryId: post.category_id,
    status: post.status === 'published' ? 'published' : 'draft',
    seoTitle: post.seo_title ?? '',
    seoDescription: post.seo_description ?? '',
    ogImageUrl: post.og_image_url,
    publishedAt: post.published_at,
  };

  return <PostForm mode="edit" initial={initial} categories={categories} />;
}
