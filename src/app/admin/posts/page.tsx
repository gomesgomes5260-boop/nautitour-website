import Link from 'next/link';
import { Plus, Image as ImageIcon, CheckCircle2, PencilLine, Send, BookOpen, Film } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import KpiCard from '@/components/KpiCard';
import Pagination from '@/components/Pagination';
import {
  REDE_LABEL, STATUS_META, TIPO_LABEL, RedeBadge, StatusBadge, SOCIAL_BUCKET,
  type SocialRede, type SocialStatus,
} from './redes';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 24;

type Search = {
  rede?: string;
  pilar?: string;
  status?: string;
  lote?: string;
  q?: string;
  page?: string;
};

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const admin = createAdminClient();
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  // Opções dos filtros + KPIs (tabela pequena — agrega em JS)
  const { data: allMeta } = await admin
    .from('social_posts')
    .select('pilar, lote, status')
    .limit(2000);
  const pilares = [...new Set((allMeta ?? []).map((r) => r.pilar).filter((p): p is string => !!p))].sort();
  const lotes = [...new Set((allMeta ?? []).map((r) => r.lote).filter((l): l is string => !!l))].sort();
  const porStatus = (s: SocialStatus) => (allMeta ?? []).filter((r) => r.status === s).length;

  let query = admin
    .from('social_posts')
    .select('id, slug, titulo, pilar, persona, rede, formato, tipo, status, lote, agendado_para', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (sp.rede && sp.rede in REDE_LABEL) query = query.eq('rede', sp.rede as SocialRede);
  if (sp.status && sp.status in STATUS_META) query = query.eq('status', sp.status as SocialStatus);
  if (sp.pilar) query = query.eq('pilar', sp.pilar);
  if (sp.lote) query = query.eq('lote', sp.lote);
  if (sp.q) {
    const safe = sp.q.replace(/[%_,()]/g, ' ').trim();
    if (safe) query = query.or(`titulo.ilike.%${safe}%,slug.ilike.%${safe}%,legenda.ilike.%${safe}%`);
  }
  const { data: posts, count } = await query;
  const rows = posts ?? [];

  // Thumbnail: primeiro asset de cada post, com URL assinada em lote (1h)
  const { data: firstAssets } = rows.length
    ? await admin
        .from('social_post_assets')
        .select('post_id, storage_path, url_publica, mime, ordem')
        .in('post_id', rows.map((r) => r.id))
        .order('ordem', { ascending: true })
    : { data: [] as Array<{ post_id: string; storage_path: string | null; url_publica: string | null; mime: string | null; ordem: number }> };
  const thumbByPost = new Map<string, { path: string | null; url: string | null; mime: string | null }>();
  const assetCount = new Map<string, number>();
  for (const a of firstAssets ?? []) {
    assetCount.set(a.post_id, (assetCount.get(a.post_id) ?? 0) + 1);
    if (!thumbByPost.has(a.post_id)) thumbByPost.set(a.post_id, { path: a.storage_path, url: a.url_publica, mime: a.mime });
  }
  // Só assina o que vive no bucket; asset com URL pública usa ela direto.
  const paths = [...thumbByPost.values()]
    .filter((t) => t.mime?.startsWith('image/') && !t.url && t.path)
    .map((t) => t.path as string);
  const { data: signed } = paths.length
    ? await admin.storage.from(SOCIAL_BUCKET).createSignedUrls(paths, 3600)
    : { data: [] };
  const urlByPath = new Map((signed ?? []).filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl]));

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== 'page') params.set(k, v);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return `/admin/posts${qs ? `?${qs}` : ''}`;
  };
  const filtroHref = (patch: Partial<Search>) => {
    const params = new URLSearchParams();
    const merged = { ...sp, ...patch, page: undefined } as Record<string, string | undefined>;
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    return `/admin/posts${qs ? `?${qs}` : ''}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-[var(--color-charcoal-900)] tracking-tight">
            Material de posts
          </h1>
          <p className="text-sm text-[var(--color-charcoal-500)] mt-1">
            Criativos prontos pra postar, com a estratégia de cada peça. Nada é publicado automaticamente.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/posts/estrategia"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-charcoal-200)] bg-white text-[var(--color-charcoal-900)] text-sm font-semibold px-4 py-2 hover:border-[var(--color-charcoal-400)] transition-colors"
          >
            <BookOpen size={15} />
            Estratégia do canal
          </Link>
          <Link
            href="/admin/posts/novo"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-semibold px-4 py-2 transition-colors"
          >
            <Plus size={15} />
            Nova peça
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <KpiCard Icon={ImageIcon} label="Peças" value={String(allMeta?.length ?? 0)} />
        <KpiCard Icon={CheckCircle2} iconTone="bg-emerald-50 text-emerald-700" label="Aprovadas" value={String(porStatus('aprovado'))} />
        <KpiCard Icon={PencilLine} iconTone="bg-amber-50 text-amber-700" label="Rascunhos" value={String(porStatus('rascunho'))} />
        <KpiCard Icon={Send} iconTone="bg-sky-50 text-sky-700" label="Publicadas" value={String(porStatus('publicado'))} />
      </div>

      {/* Filtros */}
      <div className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-4 mb-6 space-y-3">
        <form action="/admin/posts" className="flex gap-2 flex-wrap items-center">
          {sp.rede && <input type="hidden" name="rede" value={sp.rede} />}
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          {sp.pilar && <input type="hidden" name="pilar" value={sp.pilar} />}
          {sp.lote && <input type="hidden" name="lote" value={sp.lote} />}
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Buscar por título, slug ou legenda…"
            className="flex-1 min-w-48 rounded-xl border border-[var(--color-charcoal-200)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-charcoal-400)]"
          />
          <button className="rounded-xl bg-[var(--color-charcoal-900)] text-white text-sm font-semibold px-4 py-2">
            Buscar
          </button>
        </form>
        <FilterRow
          label="Rede"
          atual={sp.rede}
          itens={Object.entries(REDE_LABEL).map(([v, l]) => ({ v, l }))}
          href={(v) => filtroHref({ rede: v })}
        />
        <FilterRow
          label="Status"
          atual={sp.status}
          itens={Object.entries(STATUS_META).map(([v, m]) => ({ v, l: m.label }))}
          href={(v) => filtroHref({ status: v })}
        />
        {pilares.length > 0 && (
          <FilterRow label="Pilar" atual={sp.pilar} itens={pilares.map((p) => ({ v: p, l: p }))} href={(v) => filtroHref({ pilar: v })} />
        )}
        {lotes.length > 1 && (
          <FilterRow label="Lote" atual={sp.lote} itens={lotes.map((l) => ({ v: l, l }))} href={(v) => filtroHref({ lote: v })} />
        )}
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-10 text-center text-sm text-[var(--color-charcoal-500)]">
          Nenhuma peça encontrada.{' '}
          {(allMeta?.length ?? 0) === 0 && (
            <>Importe um lote com <code className="font-mono text-xs">node scripts/creatives/publica-posts.mjs &lt;lote&gt;</code> ou crie uma peça nova.</>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {rows.map((p) => {
            const thumb = thumbByPost.get(p.id);
            const url = thumb ? (thumb.url ?? (thumb.path ? urlByPath.get(thumb.path) : undefined)) : undefined;
            const n = assetCount.get(p.id) ?? 0;
            const isVideo = thumb?.mime === 'video/mp4';
            return (
              <Link
                key={p.id}
                href={`/admin/posts/${p.id}`}
                className="group bg-white border border-[var(--color-charcoal-100)] rounded-2xl overflow-hidden hover:border-[var(--color-charcoal-300)] transition-colors"
              >
                <div className="relative aspect-[4/5] bg-[var(--color-charcoal-100)]">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL assinada temporária, fora do otimizador
                    <img src={url} alt={p.titulo} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--color-charcoal-400)]">
                      {isVideo ? <Film size={32} /> : <ImageIcon size={32} />}
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap pr-2">
                    <RedeBadge rede={p.rede} />
                  </div>
                  <div className="absolute bottom-2 left-2 flex gap-1.5">
                    <StatusBadge status={p.status} />
                    {p.tipo !== 'imagem' && (
                      <span className="inline-block rounded-full bg-black/60 text-white px-2.5 py-1 text-[10px] font-bold">
                        {TIPO_LABEL[p.tipo]}{p.tipo === 'carrossel' && n > 1 ? ` · ${n}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-sans text-sm font-bold text-[var(--color-charcoal-900)] leading-snug line-clamp-2">
                    {p.titulo}
                  </p>
                  <p className="text-[11px] text-[var(--color-charcoal-500)] mt-1 truncate">
                    {[p.pilar, p.formato, p.lote].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <Pagination
          currentPage={page}
          totalPages={Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))}
          totalItems={count ?? 0}
          pageSize={PAGE_SIZE}
          buildHref={buildHref}
          itemLabel={{ singular: 'peça', plural: 'peças' }}
        />
      </div>
    </div>
  );
}

function FilterRow({
  label, atual, itens, href,
}: {
  label: string;
  atual?: string;
  itens: Array<{ v: string; l: string }>;
  href: (v?: string) => string;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap text-xs">
      <span className="font-bold uppercase tracking-[0.12em] text-[10px] text-[var(--color-charcoal-500)] mr-1">
        {label}
      </span>
      <Link
        href={href(undefined)}
        className={`rounded-full px-2.5 py-1 border transition-colors ${!atual ? 'bg-[var(--color-charcoal-900)] text-white border-[var(--color-charcoal-900)]' : 'bg-white text-[var(--color-charcoal-700)] border-[var(--color-charcoal-200)] hover:border-[var(--color-charcoal-400)]'}`}
      >
        Todas
      </Link>
      {itens.map(({ v, l }) => (
        <Link
          key={v}
          href={href(atual === v ? undefined : v)}
          className={`rounded-full px-2.5 py-1 border transition-colors ${atual === v ? 'bg-[var(--color-charcoal-900)] text-white border-[var(--color-charcoal-900)]' : 'bg-white text-[var(--color-charcoal-700)] border-[var(--color-charcoal-200)] hover:border-[var(--color-charcoal-400)]'}`}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
