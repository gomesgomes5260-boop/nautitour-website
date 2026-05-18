import Link from 'next/link';
import Image from 'next/image';
import { Plus, FolderTree, Calendar, FileText } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import Pagination from '@/components/Pagination';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

const DATE = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

type Search = {
  status?: 'draft' | 'published' | 'all';
  category?: string;
  page?: string;
};

function buildHref(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '' && v !== 'all') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const statusFilter: Search['status'] =
    sp.status === 'draft' || sp.status === 'published' ? sp.status : 'all';
  const categoryFilter = sp.category?.trim() || '';
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createAdminClient();

  let query = admin
    .from('blog_posts')
    .select(
      `id, slug, title, excerpt, cover_image_url, status, published_at, updated_at, created_at,
       category:blog_categories ( id, name, slug )`,
      { count: 'exact' }
    )
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (statusFilter !== 'all') query = query.eq('status', statusFilter);
  if (categoryFilter) query = query.eq('category_id', categoryFilter);

  const [{ data: postsRaw, count }, { data: categories }] = await Promise.all([
    query,
    admin
      .from('blog_categories')
      .select('id, name, slug')
      .order('name', { ascending: true }),
  ]);

  type Post = {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    cover_image_url: string | null;
    status: string;
    published_at: string | null;
    updated_at: string;
    created_at: string;
    category: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
  };

  const posts = (postsRaw ?? []) as unknown as Post[];

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Stats simples — uma query separada pra contar drafts (rápida pelo index parcial seria pra published, draft é seq scan mas volume baixo)
  const [{ count: draftCount }, { count: publishedCount }] = await Promise.all([
    admin
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft'),
    admin
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-charcoal-900)]">
            Blog
          </h1>
          <p className="text-sm text-[var(--color-charcoal-600)] mt-1">
            {publishedCount ?? 0} publicado{(publishedCount ?? 0) === 1 ? '' : 's'} ·{' '}
            {draftCount ?? 0} rascunho{(draftCount ?? 0) === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/blog/categorias"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-charcoal-700)] bg-white border border-[var(--color-charcoal-200)] hover:border-[var(--color-charcoal-300)] transition-colors"
          >
            <FolderTree size={16} />
            Categorias
          </Link>
          <Link
            href="/admin/blog/novo"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] transition-colors"
          >
            <Plus size={16} />
            Novo post
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          { key: 'all', label: 'Todos' },
          { key: 'published', label: 'Publicados' },
          { key: 'draft', label: 'Rascunhos' },
        ] as const).map((opt) => {
          const active = statusFilter === opt.key;
          return (
            <Link
              key={opt.key}
              href={buildHref({ status: opt.key, category: categoryFilter, page: 1 })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                active
                  ? 'bg-[var(--color-charcoal-900)] text-white'
                  : 'bg-white text-[var(--color-charcoal-700)] border border-[var(--color-charcoal-200)] hover:border-[var(--color-charcoal-300)]'
              }`}
            >
              {opt.label}
            </Link>
          );
        })}

        {(categories ?? []).length > 0 && (
          <form className="flex items-center gap-2 ml-auto">
            <input type="hidden" name="status" value={statusFilter} />
            <select
              name="category"
              defaultValue={categoryFilter}
              className="border border-[var(--color-charcoal-200)] rounded-lg px-3 py-1.5 text-sm bg-white text-[var(--color-charcoal-700)]"
            >
              <option value="">Todas as categorias</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--color-charcoal-700)] bg-white border border-[var(--color-charcoal-200)] hover:border-[var(--color-charcoal-300)]"
            >
              Filtrar
            </button>
          </form>
        )}
      </div>

      {/* Lista */}
      {posts.length === 0 ? (
        <div className="bg-white border border-[var(--color-charcoal-200)] rounded-xl p-10 text-center">
          <FileText size={36} className="mx-auto text-[var(--color-charcoal-400)] mb-3" />
          <p className="text-[var(--color-charcoal-700)] font-medium">Nenhum post encontrado.</p>
          <p className="text-sm text-[var(--color-charcoal-500)] mt-1">
            Crie o primeiro post pra começar.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[var(--color-charcoal-200)] rounded-xl overflow-hidden">
          <ul className="divide-y divide-[var(--color-charcoal-100)]">
            {posts.map((p) => {
              const category = Array.isArray(p.category) ? p.category[0] : p.category;
              const isPublished = p.status === 'published';
              const dateLabel = isPublished
                ? p.published_at
                  ? `Publicado ${DATE.format(new Date(p.published_at))}`
                  : 'Publicado'
                : `Atualizado ${DATE.format(new Date(p.updated_at))}`;
              return (
                <li key={p.id}>
                  <Link
                    href={`/admin/blog/${p.id}/editar`}
                    className="flex items-start gap-4 p-4 hover:bg-[var(--color-charcoal-50)] transition-colors"
                  >
                    <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-[var(--color-charcoal-100)] relative">
                      {p.cover_image_url ? (
                        <Image
                          src={p.cover_image_url}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-charcoal-400)]">
                          <FileText size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                            isPublished
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isPublished ? 'Publicado' : 'Rascunho'}
                        </span>
                        {category && (
                          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-[var(--color-charcoal-100)] text-[var(--color-charcoal-700)]">
                            {category.name}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-[var(--color-charcoal-900)] truncate">
                        {p.title}
                      </p>
                      {p.excerpt && (
                        <p className="text-sm text-[var(--color-charcoal-600)] mt-1 line-clamp-2">
                          {p.excerpt}
                        </p>
                      )}
                      <p className="text-xs text-[var(--color-charcoal-500)] mt-2 inline-flex items-center gap-1">
                        <Calendar size={11} />
                        {dateLabel} · /blog/{p.slug}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={PAGE_SIZE}
          itemLabel={{ singular: 'post', plural: 'posts' }}
          buildHref={(p) =>
            `/admin/blog${buildHref({ status: statusFilter, category: categoryFilter, page: p })}`
          }
        />
      )}
    </div>
  );
}
