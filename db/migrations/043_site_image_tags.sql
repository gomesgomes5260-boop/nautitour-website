-- 043: tags de imagens da biblioteca (/admin/imagens).
-- Aplicada via MCP em 12/ago/2026 (migration `site_image_tags`).
--
-- Pedido do admin (12/ago): galerias das páginas públicas editáveis pelo
-- painel + separar as fotos de lancha das de escuna. Tags livres (lancha,
-- escuna, bar, drone-lancha, drone-escuna...) organizam a biblioteca; tags
-- "galeria-*" (galeria-home / galeria-escuna / galeria-lancha /
-- galeria-locacao) alimentam as galerias públicas via src/lib/gallery.ts —
-- tagueou, apareceu no site. Ordem de exibição = ordem de tagueamento
-- (tagged_at asc, path asc); pra reordenar, destaguear e taguear de novo.
--
-- RLS: leitura pública (anon monta a galeria); escrita SÓ via service role
-- (server actions com gate de owner) — nenhuma policy de escrita de propósito.

create table if not exists public.site_image_tags (
  path      text not null
              check (path ~ '^[a-z0-9][a-z0-9-]*/[^/]+$'),
  tag       text not null
              check (tag ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  tagged_at timestamptz not null default now(),
  primary key (path, tag)
);

-- Leitura da galeria: where tag = X order by tagged_at, path.
create index if not exists site_image_tags_tag_order_idx
  on public.site_image_tags (tag, tagged_at, path);

alter table public.site_image_tags enable row level security;

drop policy if exists site_image_tags_public_select on public.site_image_tags;
create policy site_image_tags_public_select on public.site_image_tags
  for select to anon, authenticated
  using (true);

-- ============================================================
-- SEED (aplicado via execute_sql junto com a migration):
-- pré-tagueia as curadorias estáticas de src/lib/photo-gallery.ts pra
-- nenhuma galeria estrear vazia. O bucket NÃO espelha /public filename a
-- filename: /public/.../nome-NN.jpg existe no bucket como
-- pasta/nome-0NN-<hash8>.{webp,jpg}, e cada foto está duplicada (2 hashes,
-- artefato da migração de região de 18/jul) — por isso o `distinct on`
-- preferindo .webp e o hash menor. Exceção: trampolim-01 de /public é
-- ilhas/trampolim-aguas-001-* no bucket.
--
-- galeria-lancha foi seedada SÓ com as 2 fotos reais de lancha
-- (misc/seq-0002-f334831e.webp e misc/seq-0002-close-b73acd05.webp) —
-- decisão do dono de tirar fotos de escuna da galeria da lancha; ele
-- tagueia mais fotos de lancha pelo próprio admin.
--
-- insert into public.site_image_tags (path, tag)
-- select distinct on (t.tag, t.base) o.name, t.tag
-- from storage.objects o
-- join (values ('galeria-home','aerea/drone-praia-001-'), ...) as t(tag, base)
--   on o.name like t.base || '%'
-- where o.bucket_id = 'site-images'
-- order by t.tag, t.base, (o.name like '%.webp') desc, o.name
-- on conflict do nothing;
--
-- Resultado: galeria-home 12 · galeria-escuna 15 · galeria-locacao 14 ·
-- galeria-lancha 2 · lancha 2.
