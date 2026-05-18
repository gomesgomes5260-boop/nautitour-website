import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import CategoryManager, { type CategoryRow } from '@/components/admin/blog/CategoryManager';

export const dynamic = 'force-dynamic';

export default async function AdminBlogCategoriesPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('blog_categories')
    .select('id, name, slug, description')
    .order('name', { ascending: true });

  const categories: CategoryRow[] = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-1 text-xs text-[var(--color-charcoal-600)] hover:text-[var(--color-charcoal-900)]"
        >
          <ChevronLeft size={14} />
          Voltar
        </Link>
        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-charcoal-900)] mt-2">
          Categorias do blog
        </h1>
        <p className="text-sm text-[var(--color-charcoal-600)] mt-1">
          Posts podem opcionalmente pertencer a uma categoria. Remover uma
          categoria desassocia (não apaga) os posts dela.
        </p>
      </div>

      <CategoryManager categories={categories} />
    </div>
  );
}
