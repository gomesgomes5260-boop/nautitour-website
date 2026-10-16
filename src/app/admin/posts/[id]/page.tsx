import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isOwnerUser } from '@/lib/admin';
import { renderMarkdown, MD_PROSE_CLASS } from '@/lib/markdown';
import PostForm, { type PostFormValues } from '../PostForm';
import PostPanel from './PostPanel';
import { RedeBadge, StatusBadge, TIPO_LABEL, SOCIAL_BUCKET } from '../redes';

export const dynamic = 'force-dynamic';

const DATETIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

// timestamptz → valor de <input type="datetime-local"> em BRT (UTC-3 fixo)
function paraDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() - 3 * 3600_000);
  return d.toISOString().slice(0, 16);
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: post } = await admin
    .from('social_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!post) notFound();

  const { data: assets } = await admin
    .from('social_post_assets')
    .select('id, storage_path, formato, ordem, largura, altura, mime')
    .eq('post_id', id)
    .order('ordem', { ascending: true });
  const lista = assets ?? [];

  const { data: signed } = lista.length
    ? await admin.storage.from(SOCIAL_BUCKET).createSignedUrls(lista.map((a) => a.storage_path), 3600, { download: true })
    : { data: [] };
  const { data: signedView } = lista.length
    ? await admin.storage.from(SOCIAL_BUCKET).createSignedUrls(lista.map((a) => a.storage_path), 3600)
    : { data: [] };
  const downloadByPath = new Map((signed ?? []).filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl]));
  const viewByPath = new Map((signedView ?? []).filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl]));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user ? await isOwnerUser(user.id) : false;

  const initial: PostFormValues = {
    slug: post.slug,
    titulo: post.titulo,
    pilar: post.pilar ?? '',
    persona: post.persona ?? '',
    rede: post.rede,
    formato: post.formato ?? '',
    tipo: post.tipo,
    legenda: post.legenda,
    hashtags: post.hashtags.join(' '),
    ctaTexto: post.cta_texto ?? '',
    ctaUrl: post.cta_url ?? '',
    agendadoPara: paraDatetimeLocal(post.agendado_para),
    lote: post.lote ?? '',
    estrategiaMd: post.estrategia_md,
  };

  const assetsView = lista.map((a) => ({
    id: a.id,
    nome: a.storage_path.split('/').pop() ?? a.storage_path,
    formato: a.formato,
    mime: a.mime,
    largura: a.largura,
    altura: a.altura,
    viewUrl: viewByPath.get(a.storage_path) ?? null,
    downloadUrl: downloadByPath.get(a.storage_path) ?? null,
  }));

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <Link
          href="/admin/posts"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-charcoal-500)] hover:text-[var(--color-charcoal-900)] transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar pro material
        </Link>
        <div className="flex items-center gap-2">
          <RedeBadge rede={post.rede} />
          <StatusBadge status={post.status} />
        </div>
      </div>

      <h1 className="font-display text-2xl md:text-3xl font-semibold text-[var(--color-charcoal-900)] tracking-tight mb-1">
        {post.titulo}
      </h1>
      <p className="text-sm text-[var(--color-charcoal-500)] mb-6">
        <span className="font-mono text-xs">{post.slug}</span>
        {' · '}{TIPO_LABEL[post.tipo]}{post.formato ? ` · ${post.formato}` : ''}
        {post.lote ? ` · lote ${post.lote}` : ''}
        {post.agendado_para ? ` · sugerido pra ${DATETIME.format(new Date(post.agendado_para))}` : ''}
        {post.publicado_em ? ` · publicado em ${DATETIME.format(new Date(post.publicado_em))}` : ''}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Arquivos + legenda + status/apagar (client) */}
          <PostPanel
            postId={post.id}
            status={post.status}
            legenda={post.legenda}
            hashtags={post.hashtags}
            assets={assetsView}
            isOwner={isOwner}
          />

          <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-5 md:p-6">
            <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)] mb-4">
              Estratégia da peça
            </h2>
            {post.estrategia_md.trim() ? (
              <div
                className={MD_PROSE_CLASS}
                // renderMarkdown escapa HTML cru (micromark sem allowDangerousHtml)
                dangerouslySetInnerHTML={{ __html: renderMarkdown(post.estrategia_md) }}
              />
            ) : (
              <p className="text-sm text-[var(--color-charcoal-500)]">Sem estratégia ainda — edite abaixo.</p>
            )}
          </section>
        </div>

        <div className="lg:col-span-1">
          <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-5 md:p-6 lg:sticky lg:top-6">
            <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)] mb-4">
              Editar peça
            </h2>
            <PostForm postId={post.id} initial={initial} />
          </section>
        </div>
      </div>
    </div>
  );
}
