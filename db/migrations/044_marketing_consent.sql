-- 044: consentimento de e-mail marketing (LGPD) + descadastro em 1 clique.
-- Aplicada via MCP em 29/out/2026 (migration `marketing_consent`).
--
-- Contexto: domínio nautitour.com.br verificado no Resend → e-mail marketing
-- vira possível. Antes não existia NENHUM registro de opt-in de e-mail: o
-- toggle "Marketing" do banner de cookies era só o `retargeting` (pixels),
-- e cookie é anônimo/por navegador — não serve de base legal pra e-mail.
--
-- Modelo:
--   customers.marketing_opt_in         → pode receber promo?
--   customers.marketing_opt_in_at/source → quando/como (checkout | signup |
--                                          legitimate_interest_customer | admin)
--   customers.marketing_opt_out_at     → quando saiu (link de descadastro)
--   customers.unsubscribe_token (uuid) → /descadastrar?t=<token>
--
-- RPCs SECURITY DEFINER sem grant pra anon/authenticated (só service role,
-- chamadas pelas server actions — src/lib/marketing-consent.ts):
--   record_marketing_consent(p_email, p_opt_in, p_source)
--   marketing_unsubscribe(p_token) → e-mail mascarado ou null
--
-- Backfill (decisão do dono): clientes com reserva confirmed/completed entram
-- como opt-in por legítimo interesse (art. 7º, IX), com descadastro garantido.
-- Leads de checkout abandonado ficam FORA até marcarem o checkbox.

alter table public.customers
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists marketing_opt_in_at timestamptz,
  add column if not exists marketing_opt_in_source text,
  add column if not exists marketing_opt_out_at timestamptz,
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists customers_unsubscribe_token_key
  on public.customers (unsubscribe_token);

create index if not exists customers_marketing_opt_in_idx
  on public.customers (marketing_opt_in) where marketing_opt_in;

comment on column public.customers.marketing_opt_in is
  'Aceita receber e-mails de ofertas/novidades. Base legal em marketing_opt_in_source.';
comment on column public.customers.marketing_opt_in_source is
  'checkout | signup | legitimate_interest_customer | admin';

create or replace function public.record_marketing_consent(
  p_email text,
  p_opt_in boolean,
  p_source text default null
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if v_email is null or length(v_email) < 5 or v_email not like '%_@_%.__%' then
    raise exception 'Invalid email format' using errcode = '22023';
  end if;
  if length(v_email) > 254 then
    raise exception 'Email too long' using errcode = '22023';
  end if;
  if p_source is not null and length(p_source) > 40 then
    raise exception 'source too long' using errcode = '22023';
  end if;

  insert into public.customers (email, is_guest, marketing_opt_in, marketing_opt_in_at, marketing_opt_in_source, marketing_opt_out_at)
  values (
    v_email, true, p_opt_in,
    case when p_opt_in then now() else null end,
    case when p_opt_in then p_source else null end,
    case when p_opt_in then null else now() end
  )
  on conflict (email) do update
    set marketing_opt_in = excluded.marketing_opt_in,
        marketing_opt_in_at = case when excluded.marketing_opt_in then now() else public.customers.marketing_opt_in_at end,
        marketing_opt_in_source = case when excluded.marketing_opt_in then excluded.marketing_opt_in_source else public.customers.marketing_opt_in_source end,
        marketing_opt_out_at = case when excluded.marketing_opt_in then null else now() end,
        updated_at = now();
end;
$$;

revoke all on function public.record_marketing_consent(text, boolean, text) from public, anon, authenticated;

create or replace function public.marketing_unsubscribe(p_token uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_email text;
begin
  update public.customers
    set marketing_opt_in = false,
        marketing_opt_out_at = coalesce(marketing_opt_out_at, now()),
        updated_at = now()
    where unsubscribe_token = p_token
    returning email into v_email;
  if v_email is null then
    return null;
  end if;
  return regexp_replace(v_email, '^(.).*(@.*)$', '\1***\2');
end;
$$;

revoke all on function public.marketing_unsubscribe(uuid) from public, anon, authenticated;

update public.customers c
  set marketing_opt_in = true,
      marketing_opt_in_at = now(),
      marketing_opt_in_source = 'legitimate_interest_customer'
  where c.marketing_opt_in = false
    and c.marketing_opt_out_at is null
    and c.email not like '%.invalid'
    and exists (
      select 1 from public.bookings b
      where b.customer_id = c.id and b.status in ('confirmed', 'completed')
    );
