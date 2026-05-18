import { createAdminClient } from '@/lib/supabase/admin';
import PostForm, { type Category, type PostFormInitial } from '@/components/admin/blog/PostForm';

export const dynamic = 'force-dynamic';

const EMPTY_INITIAL: PostFormInitial = {
  title: '',
  slug: '',
  excerpt: '',
  content: [],
  coverImageUrl: null,
  coverImageAlt: '',
  categoryId: null,
  status: 'draft',
  seoTitle: '',
  seoDescription: '',
  ogImageUrl: null,
  publishedAt: null,
};

export default async function AdminBlogNovoPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('blog_categories')
    .select('id, name')
    .order('name', { ascending: true });

  const categories: Category[] = (data ?? []).map((c) => ({ id: c.id, name: c.name }));

  return <PostForm mode="create" initial={EMPTY_INITIAL} categories={categories} />;
}
