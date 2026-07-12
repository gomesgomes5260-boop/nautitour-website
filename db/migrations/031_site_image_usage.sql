-- 031_site_image_usage.sql
-- Aplicada no projeto Supabase `uydvnjcqrfjacwburvuo` (Nutitour).
--
-- Registro de uso das imagens da biblioteca (/admin/imagens): "usada" =
-- URL copiada pelo admin (gesto que leva a foto pro blog/capas). Alimenta
-- a ordenação "usadas recentemente". Histórico começa a contar a partir
-- desta migration — fotos nunca copiadas ordenam por último.

create table if not exists public.site_image_usage (
  path text primary key,
  last_used_at timestamptz not null default now(),
  times_used integer not null default 1
);

create index if not exists site_image_usage_last_used_idx
  on public.site_image_usage (last_used_at desc);

alter table public.site_image_usage enable row level security;

-- Leitura só pra admins; escrita só via service role (server actions).
drop policy if exists site_image_usage_admin_select on public.site_image_usage;
create policy site_image_usage_admin_select on public.site_image_usage
  for select to authenticated
  using (public.is_admin((select auth.uid())));
