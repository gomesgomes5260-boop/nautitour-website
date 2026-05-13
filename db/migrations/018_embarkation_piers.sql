-- 018_embarkation_piers.sql
-- Aplicada no projeto Supabase `uydvnjcqrfjacwburvuo` (Nutitour).
--
-- Píeres de embarque pra escuna em Búzios. 3 píeres possíveis:
--   - Rua das Pedras (default, sem taxa)
--   - Porto Veleiro (taxa R$ 10/pax, paga presencialmente)
--   - Píer do Pescador (taxa R$ 10/pax, paga presencialmente)
--
-- Admin pode alterar o píer de uma saída específica via RPC
-- admin_set_embarkation_pier. Cliente vê o píer atual + taxa nas
-- páginas de passeio, checkout, reserva e no e-mail de confirmação.

create table if not exists public.embarkation_piers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  fee_cents int not null default 0,
  address text,
  google_maps_url text,
  notes text,
  is_default boolean default false,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists embarkation_piers_one_default_idx
  on public.embarkation_piers (is_default) where is_default = true;

insert into public.embarkation_piers (slug, name, fee_cents, address, is_default, notes)
values
  ('rua-pedras',     'Píer da Rua das Pedras', 0,    'Rua das Pedras, Armação dos Búzios — RJ',     true,  'Embarque padrão. Sem taxa adicional.'),
  ('porto-veleiro',  'Píer do Porto Veleiro',  1000, 'Porto Veleiro, Armação dos Búzios — RJ',      false, 'Taxa de embarque de R$ 10 por pessoa paga presencialmente na loja no check-in.'),
  ('pier-pescador',  'Píer do Pescador',       1000, 'Píer do Pescador, Armação dos Búzios — RJ',   false, 'Taxa de embarque de R$ 10 por pessoa paga presencialmente na loja no check-in.')
on conflict (slug) do nothing;

alter table public.tour_schedules
  add column if not exists embarkation_pier_id uuid references public.embarkation_piers(id) on delete restrict;

update public.tour_schedules ts
   set embarkation_pier_id = (select id from public.embarkation_piers where slug = 'rua-pedras')
 where embarkation_pier_id is null;

alter table public.tour_schedules
  alter column embarkation_pier_id set not null;

create or replace function public.tg_set_default_embarkation_pier()
returns trigger language plpgsql as $$
begin
  if new.embarkation_pier_id is null then
    select id into new.embarkation_pier_id
      from public.embarkation_piers
     where is_default = true and active = true
     limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists tour_schedules_set_pier_default on public.tour_schedules;
create trigger tour_schedules_set_pier_default
  before insert on public.tour_schedules
  for each row execute function public.tg_set_default_embarkation_pier();

create or replace function public.admin_set_embarkation_pier(
  p_schedule_id uuid,
  p_pier_slug text
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_pier_id     uuid;
  v_old_pier_id uuid;
  v_actor       uuid := auth.uid();
begin
  if v_actor is null or not exists (select 1 from public.admins where user_id = v_actor) then
    raise exception 'forbidden: admin only';
  end if;

  select id into v_pier_id from public.embarkation_piers where slug = p_pier_slug and active = true;
  if v_pier_id is null then
    raise exception 'pier % not found or inactive', p_pier_slug;
  end if;

  select embarkation_pier_id into v_old_pier_id from public.tour_schedules where id = p_schedule_id;
  if v_old_pier_id = v_pier_id then return; end if;

  update public.tour_schedules
     set embarkation_pier_id = v_pier_id, updated_at = now()
   where id = p_schedule_id;

  insert into public.booking_events (booking_id, kind, payload, actor_user_id)
  select b.id, 'pier_changed',
    jsonb_build_object(
      'old_pier_slug', (select slug from public.embarkation_piers where id = v_old_pier_id),
      'new_pier_slug', p_pier_slug
    ),
    v_actor
  from public.bookings b
  where b.tour_schedule_id = p_schedule_id
    and b.status in ('pending_payment', 'confirmed');
end;
$$;

revoke all on function public.admin_set_embarkation_pier(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_set_embarkation_pier(uuid, text) to authenticated;

alter table public.embarkation_piers enable row level security;

drop policy if exists embarkation_piers_read on public.embarkation_piers;
create policy embarkation_piers_read on public.embarkation_piers
  for select using (true);
