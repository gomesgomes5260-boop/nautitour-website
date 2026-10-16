-- 045: URL pública nos assets do Material de posts — APLICADA via MCP em 16/out/2026.
-- Este arquivo é só rastreio histórico (convenção db/migrations/README.md).
--
-- Um asset pode viver numa URL pública estável (public/criativos/<lote>/ servido pelo
-- próprio site em https://www.nautitour.com.br/criativos/..., com X-Robots-Tag noindex)
-- em vez do bucket privado `social-posts`. É essa URL que as automações de postagem
-- (Meta API, Adspirer, n8n/Make) consomem — URL assinada do bucket expira em 1h.
-- Pelo menos uma das duas origens precisa existir.

alter table public.social_post_assets
  alter column storage_path drop not null,
  add column url_publica text,
  add constraint social_post_assets_origem_chk
    check (storage_path is not null or url_publica is not null);

comment on column public.social_post_assets.url_publica is
  'URL pública e estável do arquivo (servida pelo site em /criativos/...). Quando preenchida, o admin usa ela em vez de assinar o bucket.';
