import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ChevronLeft, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Container from '@/components/Container';
import BlogBookingWidget from '@/components/blog/BlogBookingWidget';
import BlogMobileBookingCta from '@/components/blog/BlogMobileBookingCta';
import { createClient } from '@/lib/supabase/server';
import { getPostBySlug, deriveExcerpt } from '@/lib/blog';
import { RichTextRenderer } from '@/components/blog/RichTextRenderer';

export const dynamic = 'force-dynamic';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nautitour-website.vercel.app';

const DATE_LONG = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const post = await getPostBySlug(supabase, slug);
  if (!post) return { title: 'Post não encontrado | Nautitour' };

  const description =
    post.seo_description?.trim() ||
    post.excerpt?.trim() ||
    deriveExcerpt(post.content, 200) ||
    'Post do blog da Nautitour.';
  const title = post.seo_title?.trim() || post.title;
  const ogImage = post.og_image_url ?? post.cover_image_url;

  return {
    title: `${title} | Nautitour`,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      url: `/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

type ScheduleRaw = {
  id: string;
  departure_at: string;
  capacity: number;
  seats_taken: number;
  price_cents: number | null;
  status: string;
  pier:
    | { slug: string; name: string; fee_cents: number }
    | { slug: string; name: string; fee_cents: number }[]
    | null;
};

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const post = await getPostBySlug(supabase, slug);
  if (!post) notFound();

  // Categoria (não exposta no PublicBlogPost — busca via id se necessário).
  let category: { name: string; slug: string } | null = null;
  if (post.category_id) {
    const { data } = await supabase
      .from('blog_categories')
      .select('name, slug')
      .eq('id', post.category_id)
      .maybeSingle();
    if (data) category = { name: data.name, slug: data.slug };
  }

  // Escuna tour + schedules pro widget de agendamento na sidebar.
  const { data: escunaTour } = await supabase
    .from('tours')
    .select('id, base_price_cents')
    .eq('slug', 'escuna-publica')
    .eq('active', true)
    .maybeSingle();

  let escunaSchedules: Array<{
    id: string;
    departure_at: string;
    capacity: number;
    seats_taken: number;
    price_cents: number | null;
    status: string;
    pier: { slug: string; name: string; fee_cents: number } | null;
  }> = [];
  if (escunaTour) {
    const { data: schedulesRaw } = await supabase
      .from('tour_schedules')
      .select(
        `id, departure_at, capacity, seats_taken, price_cents, status, pier:embarkation_piers ( slug, name, fee_cents )`,
      )
      .eq('tour_id', escunaTour.id)
      .gte('departure_at', new Date().toISOString())
      .neq('status', 'cancelled')
      .order('departure_at', { ascending: true })
      .limit(200);
    escunaSchedules = ((schedulesRaw ?? []) as unknown as ScheduleRaw[]).map(
      (s) => ({
        id: s.id,
        departure_at: s.departure_at,
        capacity: s.capacity,
        seats_taken: s.seats_taken,
        price_cents: s.price_cents,
        status: s.status,
        pier: Array.isArray(s.pier) ? s.pier[0] : s.pier,
      }),
    );
  }

  // Posts relacionados: 3 últimos da mesma categoria (se houver), fallback 3 mais
  // recentes em geral. RLS já filtra published; query exclui o próprio post.
  let relatedQuery = supabase
    .from('blog_posts')
    .select('id, slug, title, cover_image_url, cover_image_alt, published_at')
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(3);
  if (post.category_id) {
    relatedQuery = relatedQuery.eq('category_id', post.category_id);
  }
  const { data: relatedRaw } = await relatedQuery;
  const related = relatedRaw ?? [];

  const description =
    post.seo_description?.trim() ||
    post.excerpt?.trim() ||
    deriveExcerpt(post.content, 200);

  const widgetProps = {
    escunaSchedules,
    escunaPriceCents: escunaTour?.base_price_cents ?? null,
    postTitle: post.title,
  };

  return (
    <>
      <Header />
      <main className="bg-[var(--color-charcoal-50)]">
        {/* === HERO full-bleed com cover === */}
        <section className="relative w-full overflow-hidden">
          <Image
            src={post.cover_image_url}
            alt={post.cover_image_alt ?? post.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            unoptimized
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, rgba(31,31,31,0.82) 0%, rgba(31,31,31,0.55) 50%, rgba(31,31,31,0.25) 100%)',
            }}
          />
          <Container className="relative py-16 sm:py-20 md:py-24">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-xs font-semibold text-white/85 hover:text-white transition-colors"
            >
              <ChevronLeft size={14} />
              Voltar pro blog
            </Link>

            {category && (
              <Link
                href={`/blog?categoria=${category.slug}`}
                className="inline-block text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-300)] mt-6 hover:opacity-80 transition-opacity"
              >
                {category.name}
              </Link>
            )}

            <h1
              className="font-display text-white font-semibold tracking-tight mt-4 max-w-3xl"
              style={{
                fontSize: 'clamp(1.875rem, 6vw, 4rem)',
                lineHeight: '1.08',
                letterSpacing: '-0.02em',
                textShadow: '0 2px 18px rgba(0,0,0,0.35)',
              }}
            >
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-white/85 text-sm sm:text-base md:text-lg leading-relaxed mt-4 max-w-2xl">
                {post.excerpt}
              </p>
            )}

            <p className="text-xs sm:text-sm text-white/75 mt-6 inline-flex items-center gap-1.5">
              <Calendar size={13} />
              {DATE_LONG.format(new Date(post.published_at))}
            </p>
          </Container>
        </section>

        {/* === MAIN — 2 cols (article + sticky widget) === */}
        <section className="py-12 sm:py-16 md:py-20 bg-white">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              <article className="lg:col-span-7">
                <RichTextRenderer content={post.content} />
              </article>

              <aside className="hidden lg:block lg:col-span-5 lg:sticky lg:top-24 self-start">
                <BlogBookingWidget {...widgetProps} />
              </aside>
            </div>
          </Container>
        </section>

        {/* Relacionados */}
        {related.length > 0 && (
          <section className="bg-[var(--color-charcoal-50)] py-12 sm:py-16 md:py-20 border-t border-[var(--color-charcoal-100)] pb-24 lg:pb-20">
            <Container>
              <h2 className="font-display text-[var(--color-charcoal-900)] text-2xl sm:text-3xl font-semibold tracking-tight mb-8 sm:mb-10">
                Continue lendo
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {related.map((p) => (
                  <Link
                    key={p.id}
                    href={`/blog/${p.slug}`}
                    className="group rounded-2xl overflow-hidden bg-white border border-[var(--color-charcoal-100)] hover:shadow-[var(--shadow-2)] transition-shadow"
                  >
                    {p.cover_image_url && (
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
                    )}
                    <div className="p-5">
                      {p.published_at && (
                        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--color-red-600)] mb-2">
                          {DATE_LONG.format(new Date(p.published_at))}
                        </p>
                      )}
                      <h3 className="font-display text-[var(--color-charcoal-900)] text-lg font-semibold leading-tight tracking-tight group-hover:text-[var(--color-red-600)] transition-colors">
                        {p.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </Container>
          </section>
        )}
      </main>
      <Footer />

      <BlogMobileBookingCta {...widgetProps} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description,
            image: post.og_image_url ?? post.cover_image_url,
            datePublished: post.published_at,
            dateModified: post.updated_at,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `${SITE_URL}/blog/${post.slug}`,
            },
            publisher: {
              '@type': 'Organization',
              name: 'Nautitour',
              url: SITE_URL,
            },
            ...(category ? { articleSection: category.name } : {}),
          }),
        }}
      />
    </>
  );
}
