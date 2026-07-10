-- 027_seller_payouts.sql
-- Aplicada no projeto Supabase `uydvnjcqrfjacwburvuo` (Nutitour).
--
-- Fase 7 da fusão: payout PIX de comissão ao vendedor após o 1º check-in.
-- booking_id UNIQUE + claim atômico (ON CONFLICT DO NOTHING) tornam payout
-- duplicado impossível mesmo com duplo-scan/retry concorrente.

create table if not exists public.seller_payouts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id),
  seller_id uuid not null references public.sellers(id),
  amount_cents integer not null check (amount_cents >= 0),
  pix_key text,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'skipped')),
  e2e_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seller_payouts_seller_id_idx
  on public.seller_payouts (seller_id);
create index if not exists seller_payouts_status_idx
  on public.seller_payouts (status) where status in ('pending', 'failed');

alter table public.seller_payouts enable row level security;

-- Admin gerencia tudo; seller enxerga os próprios payouts (e agência os dos
-- seus sellers).
drop policy if exists seller_payouts_admin_all on public.seller_payouts;
create policy seller_payouts_admin_all on public.seller_payouts
  for all to authenticated
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

drop policy if exists seller_payouts_seller_select on public.seller_payouts;
create policy seller_payouts_seller_select on public.seller_payouts
  for select to authenticated
  using (
    seller_id = (select public.seller_id_for((select auth.uid())))
    or seller_id in (
      select s.id from public.sellers s
      where s.agency_id = (select public.seller_id_for((select auth.uid())))
    )
  );

-- Claim atômico: retorna true só pra quem inseriu a row (1 vencedor por
-- booking). Caller com claimed=false NÃO dispara PIX.
create or replace function public.claim_seller_payout(
  p_booking_id uuid,
  p_seller_id uuid,
  p_amount_cents integer,
  p_pix_key text
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_inserted uuid;
begin
  if not is_admin(auth.uid()) then
    raise exception 'not an admin';
  end if;
  insert into seller_payouts (booking_id, seller_id, amount_cents, pix_key, status)
  values (p_booking_id, p_seller_id, p_amount_cents, p_pix_key, 'pending')
  on conflict (booking_id) do nothing
  returning id into v_inserted;
  return v_inserted is not null;
end;
$function$;

revoke execute on function public.claim_seller_payout(uuid, uuid, integer, text) from anon;
