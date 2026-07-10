-- 024_sellers_foundation.sql
-- Aplicada no projeto Supabase `uydvnjcqrfjacwburvuo` (Nutitour).
--
-- Fase 3 da fusão nautitour-reservas → nautitour-website: fundação de
-- vendedores/agências. Sellers ficam em tabela PRÓPRIA (não em `admins`)
-- de propósito — `admins` gateia o painel inteiro via is_admin() e é guard
-- de ~10 RPCs security definer; misturar roles lá seria risco de escalação
-- de privilégio. MASTER/ADMIN continuam sendo `admins` (owner/admin).
--
-- Hierarquia: agency gerencia seus sellers (agency_id self-ref).
-- neto_value_cents = valor devido à empresa por passageiro inteira
-- (meia = metade) — base da fórmula de comissão do payout (fase 7).
--
-- NOTA: existem dois arquivos 023 neste diretório (colisão histórica de
-- numeração entre blog_foundation e nautitour_panel_integration). A
-- sequência retoma aqui em 024; próxima migration = 025.

create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null default 'seller' check (role in ('agency', 'seller')),
  agency_id uuid references public.sellers(id) on delete set null,
  full_name text not null,
  phone text,
  neto_value_cents integer not null default 0 check (neto_value_cents >= 0),
  pix_key text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- agência não pertence a outra agência
  constraint sellers_agency_has_no_parent check (role <> 'agency' or agency_id is null)
);

create index if not exists sellers_agency_id_idx
  on public.sellers (agency_id) where agency_id is not null;

alter table public.sellers enable row level security;

-- Guards security definer com search_path fixado (padrão da migration 021).
-- Usados em policies e nas RPCs das fases 5-7.
create or replace function public.is_seller(p_user_id uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.sellers s
    where s.user_id = p_user_id and s.active
  );
$$;

create or replace function public.seller_id_for(p_user_id uuid)
returns uuid
language sql stable security definer
set search_path = public, pg_temp
as $$
  select s.id from public.sellers s
  where s.user_id = p_user_id and s.active
  limit 1;
$$;

-- Colunas de reserva manual de vendedor + check-in em bookings.
-- amount_paid_cents = sinal registrado manualmente (PIX externo/dinheiro);
-- é a base do payout de comissão. Reservas do site não usam (ficam em 0 —
-- o valor pago delas vive em payments).
alter table public.bookings
  add column if not exists seller_id uuid references public.sellers(id),
  add column if not exists amount_paid_cents integer not null default 0,
  add column if not exists manual_payment_method text,
  add column if not exists needs_pickup boolean not null default false,
  add column if not exists pickup_address text,
  add column if not exists pickup_room text,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by uuid references auth.users(id);

alter table public.bookings
  drop constraint if exists bookings_manual_payment_method_check;
alter table public.bookings
  add constraint bookings_manual_payment_method_check
  check (
    manual_payment_method is null
    or manual_payment_method in ('pix', 'cash', 'credit_card', 'debit_card')
  );

alter table public.bookings
  drop constraint if exists bookings_amount_paid_cents_check;
alter table public.bookings
  add constraint bookings_amount_paid_cents_check check (amount_paid_cents >= 0);

create index if not exists bookings_seller_id_idx
  on public.bookings (seller_id) where seller_id is not null;

-- ── RLS ──────────────────────────────────────────────────────────────
-- Padrão do projeto: (SELECT auth.uid()) pra virar initplan (migration 021).

-- sellers: cada um vê o próprio registro
drop policy if exists sellers_self_select on public.sellers;
create policy sellers_self_select on public.sellers
  for select to authenticated
  using (user_id = (select auth.uid()));

-- sellers: agência vê os sellers dela
drop policy if exists sellers_agency_select on public.sellers;
create policy sellers_agency_select on public.sellers
  for select to authenticated
  using (
    agency_id is not null
    and agency_id = (select public.seller_id_for((select auth.uid())))
  );

-- sellers: admins gerenciam tudo
drop policy if exists sellers_admin_all on public.sellers;
create policy sellers_admin_all on public.sellers
  for all to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- bookings: seller vê as próprias reservas; agência vê as dos seus sellers.
-- Client user-scoped nas páginas /vendedor depende DESTA policy — ela é a
-- barreira real de isolamento entre vendedores.
drop policy if exists bookings_seller_select on public.bookings;
create policy bookings_seller_select on public.bookings
  for select to authenticated
  using (
    seller_id is not null
    and (
      seller_id = (select public.seller_id_for((select auth.uid())))
      or seller_id in (
        select s.id from public.sellers s
        where s.agency_id = (select public.seller_id_for((select auth.uid())))
      )
    )
  );

-- booking_passengers / booking_events: espelham via join no booking
drop policy if exists booking_passengers_seller_select on public.booking_passengers;
create policy booking_passengers_seller_select on public.booking_passengers
  for select to authenticated
  using (
    booking_id in (
      select b.id from public.bookings b
      where b.seller_id is not null
        and (
          b.seller_id = (select public.seller_id_for((select auth.uid())))
          or b.seller_id in (
            select s.id from public.sellers s
            where s.agency_id = (select public.seller_id_for((select auth.uid())))
          )
        )
    )
  );

drop policy if exists booking_events_seller_select on public.booking_events;
create policy booking_events_seller_select on public.booking_events
  for select to authenticated
  using (
    booking_id in (
      select b.id from public.bookings b
      where b.seller_id is not null
        and (
          b.seller_id = (select public.seller_id_for((select auth.uid())))
          or b.seller_id in (
            select s.id from public.sellers s
            where s.agency_id = (select public.seller_id_for((select auth.uid())))
          )
        )
    )
  );

-- Guards de seller não têm caller anônimo (policies são `to authenticated`
-- e as futuras RPCs de vendedor exigem sessão). Revoga EXECUTE do anon.
-- (Aplicado como migration separada `sellers_foundation_revoke_anon`.)
revoke execute on function public.is_seller(uuid) from anon;
revoke execute on function public.seller_id_for(uuid) from anon;
