import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const BUCKET = 'social-posts';
// Só servimos o que a própria aba cadastrou: site próprio (public/criativos) e o CDN
// onde os vídeos ficam hospedados. Evita virar proxy aberto pra qualquer URL.
const HOSTS_OK = new Set(['www.nautitour.com.br', 'nautitour.com.br', 'd2ol7oe51mr4n9.cloudfront.net']);

/**
 * Download de um asset do Material de posts pelo MESMO domínio do admin.
 *
 * Por quê: o botão "Baixar" apontava direto pra URL pública (CDN/site). Em
 * link de outro domínio o Safari do iPhone ignora o atributo `download` e só
 * abre o vídeo pra tocar — sem opção de salvar. Servindo pelo nosso domínio com
 * Content-Disposition: attachment, o celular baixa o arquivo (vai pra Arquivos
 * no iOS; de lá "Salvar vídeo" leva pra galeria).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { assetId } = await params;
  const admin = createAdminClient();
  const { data: asset } = await admin
    .from('social_post_assets')
    .select('id, storage_path, url_publica, mime')
    .eq('id', assetId)
    .maybeSingle();
  if (!asset) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const origem = asset.storage_path ?? asset.url_publica ?? '';
  const nome = (origem.split('/').pop() || `asset-${asset.id}`).replace(/[^\w.\-]+/g, '-');
  const headers = new Headers({
    'Content-Type': asset.mime ?? 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${nome}"`,
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex',
  });

  if (asset.url_publica) {
    let url: URL;
    try { url = new URL(asset.url_publica); } catch { return NextResponse.json({ error: 'bad url' }, { status: 400 }); }
    if (url.protocol !== 'https:' || !HOSTS_OK.has(url.hostname)) {
      return NextResponse.json({ error: 'host not allowed' }, { status: 400 });
    }
    const up = await fetch(url, { cache: 'no-store' });
    if (!up.ok || !up.body) return NextResponse.json({ error: `upstream ${up.status}` }, { status: 502 });
    const len = up.headers.get('content-length');
    if (len) headers.set('Content-Length', len);
    return new Response(up.body, { status: 200, headers });
  }

  const { data: blob, error } = await admin.storage.from(BUCKET).download(asset.storage_path as string);
  if (error || !blob) return NextResponse.json({ error: error?.message ?? 'download failed' }, { status: 502 });
  headers.set('Content-Length', String(blob.size));
  return new Response(blob.stream(), { status: 200, headers });
}
