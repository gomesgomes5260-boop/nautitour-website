// Publica um lote de criativos na aba "Material de posts" (/admin/posts):
// lê os specs JSON de scripts/creatives/lotes/<lote>/, os exports renderizados
// (render.mjs) e cria/atualiza as linhas em social_posts + social_post_assets,
// subindo os arquivos pro bucket privado `social-posts`.
//
//   node scripts/creatives/publica-posts.mjs 2026-10-lancamento \
//     [--assets public/criativos/2026-10-lancamento] [--publico [base-url]] \
//     [--sql saida.sql] [--dry-run] [--status aprovado|rascunho] [--forcar-estrategia]
//
// Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (lê .env.local se
// existir). Com --dry-run ou --sql não precisa de env nem de rede.
//
// Modos de arquivo:
// - padrão: sobe os arquivos pro bucket privado `social-posts` (storage_path).
// - --publico [base]: NÃO sobe nada; cada asset aponta pra URL pública estável
//   `<base>/<arquivo>` (default https://www.nautitour.com.br/criativos/<lote>,
//   que é public/criativos/<lote>/ servido pelo site com noindex). É a URL que a
//   automação de postagem consome — e o jeito de rodar de onde o Storage não alcança.
// - --sql <arquivo>: em vez de chamar a API, grava as instruções SQL (upsert dos
//   posts, assets e estratégia) pra rodar via MCP/SQL editor. Implica --publico.
//   O MCP `execute_sql` trava em DELETE (pede confirmação ao dono e estoura o
//   timeout): numa primeira carga, use --sem-delete; recargas (que precisam
//   recriar os assets) vão pelo SQL editor.
//
// Regras:
// - canal do spec → enum social_rede (feed→instagram_feed, story→instagram_story,
//   meta-ads→meta_ads, ...).
// - specs de FEED que dividem o mesmo prefixo numérico (07a..07d) viram UM post
//   tipo `carrossel` com os quadros como assets ordenados; stories com letras
//   (10a..10d) são variantes independentes.
// - status: spec com "ATENÇÃO" nas observações entra como `rascunho` (ressalva
//   pendente de confirmação do dono). Se o lote.json tiver uma revisão
//   (`revisao_*.aprovadas`), só o que está em `aprovadas` entra como `aprovado` e o
//   resto fica `rascunho`; sem revisão, vale --status (default `aprovado`).
// - specs com nome começando em `_` (descartados) são ignorados.
// - estrategia_md por peça vem dos campos do spec + persona (pilares-e-personas.md)
//   + fatos (fatos-do-produto.md). O .md geral (social_strategy) vem de voz.md +
//   pilares-e-personas.md + sistema-visual-social.md e só é sobrescrito se estiver
//   vazio (ou com --forcar-estrategia), pra não atropelar edição do owner.
// - Idempotente: upsert por slug; assets são recriados; upload com x-upsert.
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
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
const statusExplicito = args.includes('--status');
const statusDefault = statusExplicito ? args[args.indexOf('--status') + 1] : 'aprovado';
const assetsDir = resolve(repo, args.includes('--assets') ? args[args.indexOf('--assets') + 1] : join('public', 'criativos', lote));
const sqlOut = args.includes('--sql') ? resolve(process.cwd(), args[args.indexOf('--sql') + 1]) : null;
const semDelete = args.includes('--sem-delete'); // 1ª carga via MCP: sem DELETE dos assets
const publico = args.includes('--publico') || !!sqlOut;
const publicoArg = args.includes('--publico') ? args[args.indexOf('--publico') + 1] : undefined;
const publicoBase = (publicoArg && !publicoArg.startsWith('--') ? publicoArg : `https://www.nautitour.com.br/criativos/${lote}`).replace(/\/$/, '');

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
if (!dryRun && !sqlOut && (!SUPABASE_URL || !SERVICE_KEY)) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (ou use --dry-run / --sql).');
  process.exit(1);
}

// ----------------------------------------------------------------- specs
const loteDir = join(repo, 'scripts', 'creatives', 'lotes', lote);
const specFiles = readdirSync(loteDir)
  .filter((f) => f.endsWith('.json') && f !== 'lote.json' && !f.startsWith('_'))
  .sort();
if (specFiles.length === 0) { console.error(`nenhum spec em ${loteDir}`); process.exit(1); }
const specs = specFiles.map((f) => ({ file: f, ...JSON.parse(readFileSync(join(loteDir, f), 'utf8')) }));

// Revisão do dono registrada no lote.json (revisao_<data>.aprovadas) — a mais recente vale.
const loteMeta = existsSync(join(loteDir, 'lote.json')) ? JSON.parse(readFileSync(join(loteDir, 'lote.json'), 'utf8')) : {};
const revisoes = Object.keys(loteMeta).filter((k) => k.startsWith('revisao_')).sort();
const aprovadasNoLote = revisoes.length ? new Set(loteMeta[revisoes.at(-1)].aprovadas ?? []) : null;

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
function dimensoes(buf) {
  // PNG: IHDR
  if (buf.length > 24 && buf.readUInt32BE(12) === 0x49484452) {
    return { largura: buf.readUInt32BE(16), altura: buf.readUInt32BE(20) };
  }
  // JPEG: anda pelos marcadores até um SOFn (C0–CF, menos C4/C8/CC)
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { altura: buf.readUInt16BE(i + 5), largura: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return { largura: null, altura: null };
}

// SQL: literal com dollar-quoting (texto livre vira $sp$...$sp$; sem escape manual)
const sqlLit = (v) => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return `array[${v.map(sqlLit).join(',')}]::text[]`;
  const s = String(v);
  return s.includes('$sp$') ? `'${s.replace(/'/g, "''")}'` : `$sp$${s}$sp$`;
};

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
    const comRessalva = /ATEN[ÇC][AÃ]O/i.test(s.observacoes ?? '');
    const aprovadaPeloDono = aprovadasNoLote && !statusExplicito
      ? (aprovadasNoLote.has(g.nomeBase) || g.quadros.some((q) => aprovadasNoLote.has(q.nome)))
      : null;
    const status = comRessalva ? 'rascunho'
      : aprovadaPeloDono === null ? statusDefault
      : aprovadaPeloDono ? 'aprovado' : 'rascunho';
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

  console.log(`Lote ${lote}: ${specs.length} specs → ${plano.length} posts${publico ? ` · assets por URL pública (${publicoBase})` : ''}`);
  for (const p of plano) {
    const marca = p.faltando.length ? ` (FALTAM: ${p.faltando.join(', ')})` : '';
    console.log(`- ${p.slug} · ${p.rede} · ${p.tipo} · ${p.status} · ${p.todosArquivos.length} arquivo(s)${marca}`);
  }
  const semArquivo = plano.filter((p) => p.todosArquivos.length === 0);
  if (semArquivo.length) {
    console.warn(`\n! ${semArquivo.length} post(s) sem NENHUM export em ${assetsDir} — serão pulados.`);
    console.warn('  Renderize antes: node scripts/creatives/render.mjs scripts/creatives/lotes/' + lote + ' --out public/criativos/' + lote + ' --jpg');
  }
  if (dryRun) { console.log('\n(dry-run: nada enviado)'); return; }

  // ---- modo SQL: grava as instruções pra rodar via MCP / SQL editor
  if (sqlOut) {
    const linhas = [
      `-- Material de posts · lote ${lote} · gerado por scripts/creatives/publica-posts.mjs em ${new Date().toISOString()}`,
      `-- Assets apontam pra URL pública (${publicoBase}); nada vai pro bucket.`,
      'begin;',
    ];
    for (const p of plano) {
      if (p.todosArquivos.length === 0) continue;
      const estrategia = estrategiaMd({ capa: p.g.capa, rede: p.rede, formato: p.formato, tipo: p.tipo }, p.g.quadros);
      linhas.push(
        '',
        `-- ${p.slug}`,
        `insert into public.social_posts (slug, titulo, pilar, persona, rede, formato, tipo, estrategia_md, legenda, hashtags, cta_texto, cta_url, status, lote)`,
        `values (${[p.slug, p.titulo, p.pilar, p.persona].map(sqlLit).join(', ')}, ${sqlLit(p.rede)}::public.social_rede, ${sqlLit(p.formato)}, ${sqlLit(p.tipo)}::public.social_tipo, ${sqlLit(estrategia)}, ${sqlLit(p.legenda)}, ${sqlLit(p.hashtags)}, ${sqlLit(p.cta_texto)}, ${sqlLit(p.cta_url)}, ${sqlLit(p.status)}::public.social_status, ${sqlLit(p.lote)})`,
        `on conflict (slug) do update set titulo = excluded.titulo, pilar = excluded.pilar, persona = excluded.persona, rede = excluded.rede, formato = excluded.formato, tipo = excluded.tipo, estrategia_md = excluded.estrategia_md, legenda = excluded.legenda, hashtags = excluded.hashtags, cta_texto = excluded.cta_texto, cta_url = excluded.cta_url, lote = excluded.lote;`,
      );
      if (!semDelete) {
        linhas.push(`delete from public.social_post_assets where post_id = (select id from public.social_posts where slug = ${sqlLit(p.slug)});`);
      }
      let ordem = 0;
      for (const a of p.todosArquivos) {
        const ext = extname(a.path).toLowerCase();
        const dims = ext === '.mp4' ? { largura: null, altura: null } : dimensoes(readFileSync(a.path));
        linhas.push(
          `insert into public.social_post_assets (post_id, storage_path, url_publica, formato, ordem, largura, altura, mime)`,
          `select id, null, ${sqlLit(`${publicoBase}/${basename(a.path)}`)}, ${sqlLit(a.formato)}, ${ordem++}, ${sqlLit(dims.largura)}, ${sqlLit(dims.altura)}, ${sqlLit(MIME[ext])} from public.social_posts where slug = ${sqlLit(p.slug)};`,
        );
      }
    }
    linhas.push(
      '',
      '-- estratégia geral: só se vazia' + (forcarEstrategia ? ' (ou forçada)' : ''),
      `update public.social_strategy set conteudo_md = ${sqlLit(estrategiaGeralMd())}, updated_at = now() where id = 1${forcarEstrategia ? '' : " and btrim(conteudo_md) = ''"};`,
      'commit;',
      '',
    );
    writeFileSync(sqlOut, linhas.join('\n'));
    console.log(`\n✓ SQL gravado em ${sqlOut} (${plano.filter((p) => p.todosArquivos.length).length} posts). Rode via MCP Supabase (execute_sql) ou SQL editor.`);
    return;
  }

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
      if (!publico) await upload(a.path, destino, mime);
      const dims = ext === '.mp4' ? { largura: null, altura: null } : dimensoes(readFileSync(a.path));
      await sb(`/rest/v1/social_post_assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          post_id: row.id,
          storage_path: publico ? null : destino,
          url_publica: publico ? `${publicoBase}/${basename(a.path)}` : null,
          formato: a.formato, ordem: ordem++, mime, ...dims,
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
