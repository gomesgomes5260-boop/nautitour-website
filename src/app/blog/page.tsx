import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Container from '@/components/Container';
import { createClient } from '@/lib/supabase/server';
import {
  listPublishedPosts,
  listCategories,
  deriveExcerpt,
  BLOG_LIST_DEFAULT_PAGE_SIZE,
} from '@/lib/blog';

export const dynamic = 'force-dynamic';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nautitour-website.vercel.app';

export const metadata: Metadata = {
  title: 'Blog | Nautitour — Dicas e histórias de Búzios',
  description:
    'Dicas de praia, roteiros, curiosidades sobre Armação dos Búzios e bastidores dos passeios de escuna e lancha da Nautitour.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog Nautitour — Búzios por quem conhece o mar',
    description:
      'Dicas, roteiros e bastidores dos passeios em Armação dos Búzios.',
    url: '/blog',
    type: 'website',
  },
};

const DATE = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

type Search = { page?: string; categoria?: string };

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);
  const categorySlug = sp.categoria?.trim() || undefined;

  const supabase = await createClient();
  const [{ posts, total, pageSize }, categories] = await Promise.all([
    listPublishedPosts(supabase, { page, pageSize: BLOG_LIST_DEFAULT_PAGE_SIZE, categorySlug }),
    listCategories(supabase),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <Header />
      <main className="bg-[var(--color-charcoal-50)]">
        {/* Hero */}
        <section className="bg-white border-b border-[var(--color-charcoal-100)]">
          <Container className="py-12 sm:py-16 md:py-20 text-center">
            <span className="inline-block text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-600)] mb-4">
              Blog Nautitour
            </span>
            <h1
              className="font-display text-[var(--color-charcoal-900)] font-semibold tracking-tight"
              style={{
                fontSize: 'clamp(2rem, 5.5vw, 3.5rem)',
                lineHeight: '1.1',
                letterSpacing: '-0.02em',
              }}
            >
              Búzios por quem conhece o mar.
            </h1>
            <p className="text-[var(--color-charcoal-600)] text-sm sm:text-base md:text-lg leading-relaxed mt-4 max-w-2xl mx-auto">
              Dicas de praia, roteiros de escuna e curiosidades sobre Armação
              dos Búzios — direto de quem navega por aqui há anos.
            </p>
          </Container>
        </section>

        {/* Category pills */}
        {categories.length > 0 && (
          <section className="bg-white border-b border-[var(--color-charcoal-100)] py-4">
            <Container>
              <div className="flex flex-wrap justify-center gap-2">
                <CategoryPill
                  href="/blog"
                  label="Todos"
                  active={!categorySlug}
                />
                {categories.map((c) => (
                  <CategoryPill
                    key={c.id}
                    href={`/blog?categoria=${c.slug}`}
                    label={c.name}
                    active={categorySlug === c.slug}
                  />
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* Grid */}
        <section className="py-12 sm:py-16 md:py-20">
          <Container>
            {posts.length === 0 ? (
              <p className="text-center text-[var(--color-charcoal-600)]">
                Em breve, novos posts por aqui. 🌊
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {posts.map((p) => {
                  const previewText = p.excerpt?.trim() || deriveExcerpt(p.content, 160);
                  return (
                    <Link
                      key={p.id}
                      href={`/blog/${p.slug}`}
                      className="group rounded-2xl overflow-hidden bg-white border border-[var(--color-charcoal-100)] hover:shadow-[var(--shadow-2)] transition-shadow"
                    >
                      <div className="relative w-full aspect-[16/10] bg-[var(--color-charcoal-100)] overflow-hidden">
                        <Image
                          src={p.cover_image_url}
                          alt={p.cover_image_alt ?? p.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                      </div>
                      <div className="p-5 sm:p-6">
                        <p className="text-[10px] sm:text-xs font-bold tracking-[0.18em] uppercase text-[var(--color-red-600)] mb-2 inline-flex items-center gap-1.5">
                          <Calendar size={11} />
                          {DATE.format(new Date(p.published_at))}
                        </p>
                        <h2 className="font-display text-[var(--color-charcoal-900)] text-lg sm:text-xl font-semibold leading-tight tracking-tight group-hover:text-[var(--color-red-600)] transition-colors">
                          {p.title}
                        </h2>
                        {previewText && (
                          <p className="text-sm text-[var(--color-charcoal-600)] mt-3 line-clamp-3">
                            {previewText}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <nav
                aria-label="Paginação"
                className="flex items-center justify-center gap-2 mt-12 sm:mt-16"
              >
                <PageLink
                  page={page - 1}
                  categorySlug={categorySlug}
                  disabled={page <= 1}
                  label="Anterior"
                />
                <span className="text-sm text-[var(--color-charcoal-600)] px-3">
                  Página <strong>{page}</strong> de <strong>{totalPages}</strong>
                </span>
                <PageLink
                  page={page + 1}
                  categorySlug={categorySlug}
                  disabled={page >= totalPages}
                  label="Próxima"
                />
              </nav>
            )}
          </Container>
        </section>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Blog Nautitour',
            url: `${SITE_URL}/blog`,
            description:
              'Dicas, roteiros e curiosidades sobre Armação dos Búzios.',
          }),
        }}
      />
    </>
  );
}

function CategoryPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
        active
          ? 'bg-[var(--color-charcoal-900)] text-white'
          : 'bg-white border border-[var(--color-charcoal-200)] text-[var(--color-charcoal-700)] hover:border-[var(--color-charcoal-400)]'
      }`}
    >
      {label}
    </Link>
  );
}

function PageLink({
  page,
  categorySlug,
  disabled,
  label,
}: {
  page: number;
  categorySlug?: string;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled
        className="px-4 py-2 rounded-full text-sm font-medium text-[var(--color-charcoal-300)] border border-[var(--color-charcoal-100)] cursor-not-allowed"
      >
        {label}
      </span>
    );
  }
  const sp = new URLSearchParams();
  if (page > 1) sp.set('page', String(page));
  if (categorySlug) sp.set('categoria', categorySlug);
  const qs = sp.toString();
  return (
    <Link
      href={`/blog${qs ? `?${qs}` : ''}`}
      className="px-4 py-2 rounded-full text-sm font-medium text-[var(--color-charcoal-700)] bg-white border border-[var(--color-charcoal-200)] hover:border-[var(--color-charcoal-400)] transition-colors"
    >
      {label}
    </Link>
  );
}
