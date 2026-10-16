// Publica um lote de criativos na aba "Material de posts" (/admin/posts):
// lê os specs JSON de scripts/creatives/lotes/<lote>/, os exports renderizados
// (render.mjs) e cria/atualiza as linhas em social_posts + social_post_assets,
// subindo os arquivos pro bucket privado `social-posts`.
//
//   node scripts/creatives/publica-posts.mjs 2026-10-lancamento \
//     [--assets criativos/2026-10-lancamento] [--dry-run] [--status aprovado] \
//     [--forcar-estrategia]
//
// Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (lê .env.local se
// existir). Com --dry-run não precisa de env nem de rede.
//
// Regras:
// - canal do spec → enum social_rede (feed→instagram_feed, story→instagram_story,
//   meta-ads→meta_ads, ...).
// - specs de FEED que dividem o mesmo prefixo numérico (07a..07d) viram UM post
//   tipo `carrossel` com os quadros como assets ordenados; stories com letras
//   (10a..10d) são variantes independentes.
// - status default `aprovado`; spec com "ATENÇÃO" nas observações entra como
//   `rascunho` (ressalva pendente de confirmação do dono).
// - estrategia_md por peça vem dos campos do spec + persona (pilares-e-personas.md)
//   + fatos (fatos-do-produto.md). O .md geral (social_strategy) vem de voz.md +
//   pilares-e-personas.md + sistema-visual-social.md e só é sobrescrito se estiver
//   vazio (ou com --forcar-estrategia), pra não atropelar edição do owner.
// - Idempotente: upsert por slug; assets são recriados; upload com x-upsert.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..', '..');

// ----------------------------------------------------------------- args/env
const args = process.argv.slice(2);
const lote = args.find((a) => !a.startsWith('--'));
if (!lote) {
  console.error('uso: node scripts/creatives/publica-posts.mjs <lote> [--assets dir] [--dry-run] [--status aprovado|rascunho] [--forcar-estrategia]');
  process.exit(1);
}
const dryRun = args.includes('--dry-run');
const forcarEstrategia = args.includes('--forcar-estrategia');
const statusDefault = args.includes('--status') ? args[args.indexOf('--status') + 1] : 'aprovado';
const assetsDir = resolve(repo, args.includes('--assets') ? args[args.indexOf('--assets') + 1] : join('criativos', lote));

// .env.local best-effort (sem dependência de dotenv)
const envPath = join(repo, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!dryRun && (!SUPABASE_URL || !SERVICE_KEY)) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (ou use --dry-run).');
  process.exit(1);
}

// ----------------------------------------------------------------- specs
const loteDir = join(repo, 'scripts', 'creatives', 'lotes', lote);
const specFiles = readdirSync(loteDir).filter((f) => f.endsWith('.json') && f !== 'lote.json').sort();
if (specFiles.length === 0) { console.error(`nenhum spec em ${loteDir}`); process.exit(1); }
const specs = specFiles.map((f) => ({ file: f, ...JSON.parse(readFileSync(join(loteDir, f), 'utf8')) }));

const REDE = {
  feed: 'instagram_feed', story: 'instagram_story', stories: 'instagram_story',
  reels: 'instagram_reels', 'meta-ads': 'meta_ads', meta_ads: 'meta_ads',
  facebook: 'facebook', tiktok: 'tiktok', shorts: 'youtube_shorts',
  'youtube-shorts': 'youtube_shorts', 'whatsapp-status': 'whatsapp_status',
};
const redeDe = (canal) => REDE[(canal || 'feed').toLowerCase()] ??
  (console.warn(`! canal desconhecido "${canal}" → instagram_feed`), 'instagram_feed');

// Agrupa FEED com prefixo numérico compartilhado (07a..07d) em carrossel.
function agrupar(specs) {
  const grupos = new Map();
  for (const s of specs) {
    const m = s.nome.match(/^(\d+)([a-z])?-(.+)$/);
    const canal = (s.canal || 'feed').toLowerCase();
    const chave = m && m[2] && canal === 'feed' ? `grupo-${m[1]}` : s.nome;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(s);
  }
  return [...grupos.values()].map((lista) => {
    lista.sort((a, b) => a.nome.localeCompare(b.nome));
    const capa = lista[0];
    const carrossel = lista.length > 1;
    const m = capa.nome.match(/^(\d+)[a-z]?-(.+)$/);
    // 07a-curiosidade-praias-capa → 07-curiosidade-praias (tira a letra e o sufixo do quadro)
    const nomeBase = carrossel
      ? `${m[1]}-${m[2].split('-').slice(0, -1).join('-') || m[2]}`
      : capa.nome;
    return { nomeBase, capa, quadros: lista, carrossel };
  });
}

// ----------------------------------------------------------------- brand docs
const lerDoc = (p) => readFileSync(join(repo, 'docs', 'brand', p), 'utf8');
const pilaresDoc = lerDoc('pilares-e-personas.md');

// Trecho da persona (seção "### Nome, ..." do pilares-e-personas.md)
function trechoPersona(persona) {
  if (!persona) return null;
  const nome = persona.split(/[ (,]/)[0];
  const re = new RegExp(`### (${nome}[^\\n]*)\\n([\\s\\S]*?)(?=\\n### |\\n## |$)`);
  const m = pilaresDoc.match(re);
  return m ? `**${m[1].trim()}**\n${m[2].trim()}` : null;
}

const FATOS_ESCUNA = [
  'Preço: R$ 60 por pessoa (site mostra "de R$ 70 por R$ 60")',
  'Duração: 2h30 · 12 praias e 3 ilhas · 3 paradas de mergulho de até 20 min',
  'Saídas: sáb e dom 9h30 e 12h · seg a sex 11h30 · capacidade 120',
  'Embarque: Píer da Rua das Pedras (sem taxa); Porto Veleiro e Pescador R$ 10/pax no local',
  'Reserva online com Pix ou cartão à vista, ou pelo WhatsApp',
].join('\n- ');

const DIA_POR_PILAR = {
  '1': 'Segunda-feira (pauta semanal), manhã.',
  '2': 'Sábado (foto do dia), fim de tarde.',
  '3': 'Domingo ou terça, à noite (horário de rolagem).',
  '4': 'Terça-feira, início da noite.',
  '5': 'Quinta ou sexta, fim de tarde (17h–19h) — vendendo o fim de semana. Story de véspera: no dia anterior à saída, só com vaga confirmada no admin.',
  '6': 'Quarta-feira, fim de tarde.',
};
const diaSugerido = (pilar) => DIA_POR_PILAR[(pilar || '').trim()[0]] ?? 'A definir no calendário editorial.';

const REDE_LABEL = {
  instagram_feed: 'Instagram — Feed', instagram_story: 'Instagram — Story',
  instagram_reels: 'Instagram — Reels', facebook: 'Facebook', tiktok: 'TikTok',
  youtube_shorts: 'YouTube Shorts', whatsapp_status: 'Status do WhatsApp',
  meta_ads: 'Meta Ads (anúncio pago)',
};

function estrategiaMd(post, quadros) {
  const s = post.capa;
  const partes = [
    `# ${s.titulo}`,
    '',
    `## Objetivo`,
    s.pilar?.startsWith('5') ? 'Converter: levar quem já conhece o passeio a reservar (clique no link ou mensagem no WhatsApp).'
      : s.pilar?.startsWith('3') ? 'Engajar: gerar comentários e respostas que alimentam o alcance da conta.'
      : s.pilar?.startsWith('4') ? 'Educar: tirar as dúvidas que seguram a reserva (como funciona, horários, embarque).'
      : s.pilar?.startsWith('2') ? 'Provar: gente de verdade vivendo o passeio — confiança pra quem está decidindo.'
      : s.pilar?.startsWith('6') ? 'Vender a lancha privativa (maior ticket) pra casais e grupos pequenos.'
      : 'Inspirar: manter a marca na cabeça com a paisagem e o barco.',
    '',
    `## Pilar de conteúdo`,
    s.pilar ?? '—',
    '',
    `## Público-alvo (persona)`,
    trechoPersona(s.persona) ?? (s.persona ?? '—'),
    '',
    `## Rede e formato`,
    `${REDE_LABEL[post.rede]} · formato ${post.formato}${post.tipo === 'carrossel' ? ` · carrossel de ${quadros.length} quadros` : ''}`,
    '',
    `## Legenda sugerida`,
    '```',
    (s.legenda || '').trim() || '(sem legenda — peça de story/arte pura)',
    '```',
    '',
    `## Hashtags`,
    (s.hashtags?.length ? s.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ') : '(sem hashtags)'),
    '',
    `## CTA e destino`,
    `${s.cta?.texto ?? '—'}${s.destino || s.cta?.destino ? ` → ${s.destino ?? s.cta.destino}` : ''}`,
    '',
    `## Dia e horário sugerido`,
    diaSugerido(s.pilar),
    '',
    `## Fatos do produto usados (fonte: docs/brand/fatos-do-produto.md)`,
    `- ${FATOS_ESCUNA}`,
  ];
  if (post.tipo === 'carrossel') {
    partes.push('', '## Quadros do carrossel');
    quadros.forEach((q, i) => partes.push(`${i + 1}. **${q.titulo}**${q.fato ? ` — ${q.fato}` : ''}`));
  }
  if (s.observacoes) partes.push('', `## Observações`, s.observacoes);
  return partes.join('\n');
}

function estrategiaGeralMd() {
  const corpo = [
    '# Estratégia do canal — Escuna Estrela',
    '',
    `_Gerado de docs/brand/voz.md, pilares-e-personas.md e sistema-visual-social.md em ${new Date().toISOString().slice(0, 10)}. O owner pode editar aqui; os docs no repo continuam sendo a fonte da marca._`,
    '',
    '---',
    '',
    lerDoc('voz.md').trim(),
    '',
    '---',
    '',
    pilaresDoc.trim(),
    '',
    '---',
    '',
    lerDoc('sistema-visual-social.md').trim(),
  ];
  return corpo.join('\n');
}

// ----------------------------------------------------------------- assets
function dimensoesPng(buf) {
  if (buf.length > 24 && buf.readUInt32BE(12) === 0x49484452) {
    return { largura: buf.readUInt32BE(16), altura: buf.readUInt32BE(20) };
  }
  return { largura: null, altura: null };
}

function arquivosDoSpec(s) {
  // render.mjs grava <nome>-<formato>.<png|jpg>; vídeo exportado à parte vira <nome>-<formato>.mp4
  const achados = [];
  for (const formato of s.formatos ?? []) {
    for (const ext of ['png', 'jpg', 'jpeg', 'mp4']) {
      const p = join(assetsDir, `${s.nome}-${formato}.${ext}`);
      if (existsSync(p)) { achados.push({ path: p, formato }); break; }
    }
  }
  return achados;
}

// ----------------------------------------------------------------- supabase REST
const cab = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};
async function sb(pathname, init = {}) {
  const r = await fetch(`${SUPABASE_URL}${pathname}`, { ...init, headers: { ...cab, ...(init.headers ?? {}) } });
  if (!r.ok) throw new Error(`${init.method ?? 'GET'} ${pathname} → ${r.status} ${await r.text()}`);
  return r;
}

async function upload(caminhoLocal, caminhoBucket, mime) {
  await sb(`/storage/v1/object/social-posts/${caminhoBucket}`, {
    method: 'POST',
    headers: { 'Content-Type': mime, 'x-upsert': 'true' },
    body: readFileSync(caminhoLocal),
  });
}

// ----------------------------------------------------------------- main
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp4': 'video/mp4' };

async function main() {
  const grupos = agrupar(specs);
  const plano = [];
  for (const g of grupos) {
    const s = g.capa;
    const rede = redeDe(s.canal);
    const todosArquivos = g.quadros.flatMap((q) => arquivosDoSpec(q).map((a) => ({ ...a, quadro: q })));
    const temVideo = todosArquivos.some((a) => extname(a.path) === '.mp4');
    const tipo = g.carrossel ? 'carrossel' : temVideo ? 'video' : 'imagem';
    const status = /ATEN[ÇC][AÃ]O/i.test(s.observacoes ?? '') ? 'rascunho' : statusDefault;
    const faltando = g.quadros.flatMap((q) =>
      (q.formatos ?? []).filter((f) => !arquivosDoSpec(q).some((a) => a.formato === f)).map((f) => `${q.nome}-${f}`));
    plano.push({
      slug: `${lote}-${g.nomeBase}`.toLowerCase(),
      titulo: s.titulo,
      pilar: s.pilar ?? null,
      persona: s.persona ?? null,
      rede,
      formato: (g.capa.formatos ?? [])[0] ?? null,
      tipo,
      status,
      legenda: s.legenda ?? '',
      hashtags: s.hashtags ?? [],
      cta_texto: s.cta?.texto ?? null,
      cta_url: s.destino ?? s.cta?.destino ?? null,
      lote,
      g, todosArquivos, faltando,
    });
  }

  console.log(`Lote ${lote}: ${specs.length} specs → ${plano.length} posts`);
  for (const p of plano) {
    const marca = p.faltando.length ? ` (FALTAM: ${p.faltando.join(', ')})` : '';
    console.log(`- ${p.slug} · ${p.rede} · ${p.tipo} · ${p.status} · ${p.todosArquivos.length} arquivo(s)${marca}`);
  }
  const semArquivo = plano.filter((p) => p.todosArquivos.length === 0);
  if (semArquivo.length) {
    console.warn(`\n! ${semArquivo.length} post(s) sem NENHUM export em ${assetsDir} — serão pulados.`);
    console.warn('  Renderize antes: node scripts/creatives/render.mjs scripts/creatives/lotes/' + lote + ' --out criativos/' + lote);
  }
  if (dryRun) { console.log('\n(dry-run: nada enviado)'); return; }

  for (const p of plano) {
    if (p.todosArquivos.length === 0) continue;
    const estrategia = estrategiaMd(
      { capa: p.g.capa, rede: p.rede, formato: p.formato, tipo: p.tipo },
      p.g.quadros
    );
    const r = await sb(`/rest/v1/social_posts?on_conflict=slug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify([{
        slug: p.slug, titulo: p.titulo, pilar: p.pilar, persona: p.persona,
        rede: p.rede, formato: p.formato, tipo: p.tipo, estrategia_md: estrategia,
        legenda: p.legenda, hashtags: p.hashtags, cta_texto: p.cta_texto,
        cta_url: p.cta_url, status: p.status, lote: p.lote,
      }]),
    });
    const [row] = await r.json();

    // Assets: recria do zero (idempotente)
    await sb(`/rest/v1/social_post_assets?post_id=eq.${row.id}`, { method: 'DELETE' });
    let ordem = 0;
    for (const a of p.todosArquivos) {
      const ext = extname(a.path).toLowerCase();
      const mime = MIME[ext];
      const destino = `${lote}/${basename(a.path)}`;
      await upload(a.path, destino, mime);
      const dims = ext === '.mp4' ? { largura: null, altura: null } : dimensoesPng(readFileSync(a.path));
      await sb(`/rest/v1/social_post_assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          post_id: row.id, storage_path: destino, formato: a.formato,
          ordem: ordem++, mime, ...dims,
        }]),
      });
    }
    console.log(`✓ ${p.slug} (${p.todosArquivos.length} asset(s))`);
  }

  // Estratégia geral: só escreve se vazia (ou --forcar-estrategia)
  const atual = await (await sb(`/rest/v1/social_strategy?id=eq.1&select=conteudo_md`)).json();
  const vazia = !atual[0] || !atual[0].conteudo_md?.trim();
  if (vazia || forcarEstrategia) {
    await sb(`/rest/v1/social_strategy?id=eq.1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conteudo_md: estrategiaGeralMd() }),
    });
    console.log('✓ estratégia geral do canal gravada');
  } else {
    console.log('• estratégia geral já tem conteúdo — mantida (use --forcar-estrategia pra sobrescrever)');
  }
  console.log('\nPronto. Confira em /admin/posts.');
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
