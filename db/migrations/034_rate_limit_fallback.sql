-- 034_rate_limit_fallback.sql
-- ✅ APLICADA via MCP em 18/jul/2026 (projeto hpinfkvfzezuizmeqsfm).
--
-- Rate limit persistente no Postgres — vira o backend PADRÃO depois que o
-- database do Upstash foi deletado (ENOTFOUND derrubou o login em produção,
-- ver PR #112). Upstash continua suportado como backend preferencial se as
-- envs UPSTASH_REDIS_REST_* voltarem; sem elas, `src/lib/rate-limit.ts`
-- usa a RPC abaixo via service role.
--
-- Modelo: fixed window por chave (1 row por chave; upsert atômico decide
-- reset-ou-incremento na mesma statement). Menos suave que o sliding window
-- do Upstash, mas suficiente pros limites do site (ex.: 10 logins/15min).

create table if not exists public.rate_limit_hits (
  key text primary key,
  window_started_at timestamptz not null default now(),
  hits integer not null default 1
);

alter table public.rate_limit_hits enable row level security;
-- Sem policies de propósito: nenhum acesso client-side; só service role
-- (bypassa RLS) e a RPC security definer abaixo.

create or replace function public.rate_limit_check(
  p_key text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_allowed boolean;
begin
  insert into rate_limit_hits as r (key, window_started_at, hits)
  values (p_key, v_now, 1)
  on conflict (key) do update set
    hits = case
      when r.window_started_at < v_now - make_interval(secs => p_window_seconds)
        then 1
      else r.hits + 1
    end,
    window_started_at = case
      when r.window_started_at < v_now - make_interval(secs => p_window_seconds)
        then v_now
      else r.window_started_at
    end
  returning hits <= p_limit into v_allowed;
  return v_allowed;
end;
$$;

revoke execute on function public.rate_limit_check(text, integer, integer)
  from public, anon, authenticated;

-- Limpeza diária das janelas mortas (chaves = IPs; tabela não cresce sem teto).
select cron.schedule(
  'cleanup_rate_limit_hits',
  '30 5 * * *',
  $$delete from public.rate_limit_hits where window_started_at < now() - interval '1 day'$$
);
