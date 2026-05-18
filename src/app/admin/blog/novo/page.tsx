import { createAdminClient } from '@/lib/supabase/admin';
import PostForm, { makeEmptyInitial, type Category } from '@/components/admin/blog/PostForm';

export const dynamic = 'force-dynamic';

export default async function AdminBlogNovoPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('blog_categories')
    .select('id, name')
    .order('name', { ascending: true });

  const categories: Category[] = (data ?? []).map((c) => ({ id: c.id, name: c.name }));

  return <PostForm mode="create" initial={makeEmptyInitial()} categories={categories} />;
}
