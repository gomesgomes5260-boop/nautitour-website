import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isOwnerUser } from '@/lib/admin';
import { renderMarkdown, MD_PROSE_CLASS } from '@/lib/markdown';
import StrategyEditor from './StrategyEditor';

export const dynamic = 'force-dynamic';

const DATETIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

export default async function EstrategiaPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('social_strategy')
    .select('conteudo_md, updated_at')
    .eq('id', 1)
    .maybeSingle();
  const conteudo = data?.conteudo_md ?? '';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user ? await isOwnerUser(user.id) : false;

  return (
    <div>
      <Link
        href="/admin/posts"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-charcoal-500)] hover:text-[var(--color-charcoal-900)] transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Voltar pro material
      </Link>
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-[var(--color-charcoal-900)] tracking-tight">
          Estratégia do canal
        </h1>
        {data?.updated_at && (
          <span className="text-xs text-[var(--color-charcoal-500)]">
            atualizada em {DATETIME.format(new Date(data.updated_at))}
          </span>
        )}
      </div>
      <p className="text-sm text-[var(--color-charcoal-500)] mb-6">
        Público, tom de voz, pilares, calendário editorial e sistema visual — a referência da equipe.
        {isOwner ? ' Você (owner) pode editar.' : ' Edição é do owner.'}
      </p>

      {isOwner ? (
        <StrategyEditor conteudoInicial={conteudo} />
      ) : conteudo.trim() ? (
        <div className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-5 md:p-8">
          <div
            className={MD_PROSE_CLASS}
            // renderMarkdown escapa HTML cru (micromark sem allowDangerousHtml)
            dangerouslySetInnerHTML={{ __html: renderMarkdown(conteudo) }}
          />
        </div>
      ) : (
        <div className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-10 text-center text-sm text-[var(--color-charcoal-500)]">
          Ainda sem estratégia publicada. O importador (<code className="font-mono text-xs">publica-posts.mjs</code>) gera a primeira versão a partir dos docs de marca.
        </div>
      )}
    </div>
  );
}
