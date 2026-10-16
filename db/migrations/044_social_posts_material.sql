-- 044: Material de posts (aba /admin/posts) — APLICADA via MCP em 16/out/2026.
-- Este arquivo é só rastreio histórico (convenção db/migrations/README.md).
--
-- Criativos prontos pra postar + estratégia por peça (markdown) + .md geral.
-- Nada é publicado automaticamente — a aba só organiza e disponibiliza.
-- Gates: leitura/escrita admin (is_admin); mudança de status e delete são
-- OWNER na camada de app (isOwnerUser); delete também owner-only no RLS.
-- Escrita real acontece via service role (server actions) — RLS é defesa extra.

create type public.social_rede as enum (
  'instagram_feed','instagram_story','instagram_reels','facebook',
  'tiktok','youtube_shorts','whatsapp_status','meta_ads'
);
create type public.social_tipo as enum ('imagem','video','carrossel');
create type public.social_status as enum ('rascunho','aprovado','publicado','descartado');

create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  titulo text not null,
  pilar text,
  persona text,
  rede public.social_rede not null,
  formato text,
  tipo public.social_tipo not null default 'imagem',
  estrategia_md text not null default '',
  legenda text not null default '',
  hashtags text[] not null default '{}',
  cta_texto text,
  cta_url text,
  status public.social_status not null default 'rascunho',
  agendado_para timestamptz,
  publicado_em timestamptz,
  lote text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.social_post_assets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  storage_path text not null,
  formato text,
  ordem int not null default 0,
  largura int,
  altura int,
  mime text,
  created_at timestamptz not null default now()
);

create index social_posts_lote_idx on public.social_posts (lote);
create index social_posts_rede_status_idx on public.social_posts (rede, status);
create index social_post_assets_post_idx on public.social_post_assets (post_id, ordem);

-- Estratégia geral do canal (linha única, markdown)
create table public.social_strategy (
  id smallint primary key default 1 check (id = 1),
  conteudo_md text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.social_posts enable row level security;
alter table public.social_post_assets enable row level security;
alter table public.social_strategy enable row level security;

create policy social_posts_select on public.social_posts
  for select using (public.is_admin((select auth.uid())));
create policy social_posts_insert on public.social_posts
  for insert with check (public.is_admin((select auth.uid())));
create policy social_posts_update on public.social_posts
  for update using (public.is_admin((select auth.uid())));
create policy social_posts_delete on public.social_posts
  for delete using (exists (
    select 1 from public.admins a
    where a.user_id = (select auth.uid()) and a.role = 'owner'
  ));

create policy social_post_assets_select on public.social_post_assets
  for select using (public.is_admin((select auth.uid())));
create policy social_post_assets_write on public.social_post_assets
  for all using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

create policy social_strategy_select on public.social_strategy
  for select using (public.is_admin((select auth.uid())));
create policy social_strategy_update on public.social_strategy
  for update using (exists (
    select 1 from public.admins a
    where a.user_id = (select auth.uid()) and a.role = 'owner'
  ));

insert into public.social_strategy (id, conteudo_md) values (1, '') on conflict do nothing;

create trigger tg_social_posts_updated_at
  before update on public.social_posts
  for each row execute function public.set_updated_at();

-- Bucket privado dos criativos (mesmo padrão do commission-receipts)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'social-posts', 'social-posts', false, 104857600,
  array['image/png','image/jpeg','image/webp','video/mp4']
)
on conflict (id) do nothing;
