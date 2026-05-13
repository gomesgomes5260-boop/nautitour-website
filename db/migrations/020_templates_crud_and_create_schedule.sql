-- 020_templates_crud_and_create_schedule.sql
-- Aplicada no projeto Supabase `uydvnjcqrfjacwburvuo` (Nutitour).
--
-- RPCs admin pra CRUD de schedule_templates + criação manual de saídas:
--
-- - admin_create_schedule_template(tour_id, weekday, departure_time, capacity, price_cents?)
-- - admin_update_schedule_template(template_id, weekday?, departure_time?, capacity?, price_cents?, active?)
-- - admin_delete_schedule_template(template_id)
-- - admin_create_tour_schedule(tour_id, departure_at, capacity, price_cents?, pier_slug?, status?)
--
-- Schedule_templates ganha unique (tour_id, weekday, departure_time) pra
-- evitar duplicação.

create unique index if not exists schedule_templates_unique_tour_day_time_idx
  on public.schedule_templates (tour_id, weekday, departure_time);

create or replace function public.admin_create_schedule_template(
  p_tour_id        uuid,
  p_weekday        int,
  p_departure_time time,
  p_capacity       int,
  p_price_cents    int default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_actor uuid := auth.uid(); v_id uuid;
begin
  if v_actor is null or not exists (select 1 from public.admins where user_id = v_actor) then
    raise exception 'forbidden: admin only'; end if;
  if p_weekday < 0 or p_weekday > 6 then raise exception 'weekday inválido'; end if;
  if p_capacity <= 0 then raise exception 'capacity deve ser > 0'; end if;
  if p_price_cents is not null and p_price_cents < 0 then raise exception 'price_cents inválido'; end if;
  if not exists (select 1 from public.tours where id = p_tour_id and active = true) then
    raise exception 'tour não encontrado ou inativo'; end if;

  insert into public.schedule_templates (tour_id, weekday, departure_time, capacity, price_cents, active)
  values (p_tour_id, p_weekday, p_departure_time, p_capacity, p_price_cents, true)
  returning id into v_id;
  return v_id;
end;$$;
revoke all on function public.admin_create_schedule_template(uuid, int, time, int, int) from public, anon, authenticated;
grant execute on function public.admin_create_schedule_template(uuid, int, time, int, int) to authenticated;

create or replace function public.admin_update_schedule_template(
  p_template_id    uuid,
  p_weekday        int default null,
  p_departure_time time default null,
  p_capacity       int default null,
  p_price_cents    int default null,
  p_active         boolean default null
) returns void
language plpgsql security definer set search_path = public
as $$
declare v_actor uuid := auth.uid();
begin
  if v_actor is null or not exists (select 1 from public.admins where user_id = v_actor) then
    raise exception 'forbidden: admin only'; end if;
  if p_weekday is not null and (p_weekday < 0 or p_weekday > 6) then raise exception 'weekday inválido'; end if;
  if p_capacity is not null and p_capacity <= 0 then raise exception 'capacity inválida'; end if;

  update public.schedule_templates
     set weekday        = coalesce(p_weekday, weekday),
         departure_time = coalesce(p_departure_time, departure_time),
         capacity       = coalesce(p_capacity, capacity),
         price_cents    = case
           when p_price_cents is null then price_cents
           when p_price_cents < 0 then null
           else p_price_cents end,
         active         = coalesce(p_active, active),
         updated_at     = now()
   where id = p_template_id;
  if not found then raise exception 'template % não encontrado', p_template_id; end if;
end;$$;
revoke all on function public.admin_update_schedule_template(uuid, int, time, int, int, boolean) from public, anon, authenticated;
grant execute on function public.admin_update_schedule_template(uuid, int, time, int, int, boolean) to authenticated;

create or replace function public.admin_delete_schedule_template(
  p_template_id uuid
) returns void
language plpgsql security definer set search_path = public
as $$
declare v_actor uuid := auth.uid();
begin
  if v_actor is null or not exists (select 1 from public.admins where user_id = v_actor) then
    raise exception 'forbidden: admin only'; end if;
  delete from public.schedule_templates where id = p_template_id;
  if not found then raise exception 'template % não encontrado', p_template_id; end if;
end;$$;
revoke all on function public.admin_delete_schedule_template(uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_schedule_template(uuid) to authenticated;

create or replace function public.admin_create_tour_schedule(
  p_tour_id      uuid,
  p_departure_at timestamptz,
  p_capacity     int,
  p_price_cents  int default null,
  p_pier_slug    text default null,
  p_status       text default 'open'
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_actor uuid := auth.uid(); v_pier_id uuid; v_id uuid; v_status schedule_status;
begin
  if v_actor is null or not exists (select 1 from public.admins where user_id = v_actor) then
    raise exception 'forbidden: admin only'; end if;
  if not exists (select 1 from public.tours where id = p_tour_id and active = true) then
    raise exception 'tour não encontrado ou inativo'; end if;
  if p_capacity <= 0 then raise exception 'capacity deve ser > 0'; end if;
  if p_departure_at < now() then raise exception 'departure_at deve ser no futuro'; end if;
  if p_status not in ('open','sold_out','cancelled') then raise exception 'status inválido'; end if;
  v_status := p_status::schedule_status;

  if p_pier_slug is not null then
    select id into v_pier_id from public.embarkation_piers where slug = p_pier_slug and active = true;
    if v_pier_id is null then raise exception 'pier % não encontrado/inativo', p_pier_slug; end if;
  end if;

  insert into public.tour_schedules (tour_id, departure_at, capacity, price_cents, status, embarkation_pier_id)
  values (
    p_tour_id, p_departure_at, p_capacity,
    case when p_price_cents is null or p_price_cents < 0 then null else p_price_cents end,
    v_status, v_pier_id  -- pode ser NULL; trigger preenche com default
  ) returning id into v_id;
  return v_id;
end;$$;
revoke all on function public.admin_create_tour_schedule(uuid, timestamptz, int, int, text, text) from public, anon, authenticated;
grant execute on function public.admin_create_tour_schedule(uuid, timestamptz, int, int, text, text) to authenticated;
