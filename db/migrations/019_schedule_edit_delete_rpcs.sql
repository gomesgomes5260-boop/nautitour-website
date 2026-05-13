-- 019_schedule_edit_delete_rpcs.sql
-- Aplicada no projeto Supabase `uydvnjcqrfjacwburvuo` (Nutitour).
--
-- RPCs admin pra editar e deletar tour_schedules:
--
-- admin_update_tour_schedule(schedule_id, departure_at?, capacity?, price_cents?, status?)
--   Retorna table com IDs das bookings afetadas + emails (pra notificação).
--   Loga evento 'schedule_changed' com diff em booking_events de cada
--   booking ativa.
--
-- admin_delete_tour_schedule(schedule_id, force=false) returns int (bookings cancelled)
--   Bloqueia delete se houver bookings ativas. Com force=true, cancela
--   bookings primeiro (e loga admin_cancelled) e depois deleta.

create or replace function public.admin_update_tour_schedule(
  p_schedule_id  uuid,
  p_departure_at timestamptz default null,
  p_capacity     int default null,
  p_price_cents  int default null,
  p_status       text default null
) returns table (
  affected_booking_id uuid,
  affected_booking_code text,
  customer_email text,
  old_departure_at timestamptz,
  new_departure_at timestamptz
)
language plpgsql security definer set search_path = public
as $$
declare
  v_actor       uuid := auth.uid();
  v_old_dep     timestamptz;
  v_old_cap     int;
  v_old_price   int;
  v_old_status  text;
  v_seats_taken int;
  v_diff        jsonb := '{}'::jsonb;
  v_status_enum schedule_status;
begin
  if v_actor is null or not exists (select 1 from public.admins where user_id = v_actor) then
    raise exception 'forbidden: admin only';
  end if;

  select departure_at, capacity, price_cents, status, seats_taken
    into v_old_dep, v_old_cap, v_old_price, v_old_status, v_seats_taken
    from public.tour_schedules where id = p_schedule_id;
  if v_old_dep is null then raise exception 'schedule % not found', p_schedule_id; end if;

  if p_capacity is not null and p_capacity < v_seats_taken then
    raise exception 'capacity (%) abaixo de seats_taken (%)', p_capacity, v_seats_taken;
  end if;
  if p_status is not null then
    if p_status not in ('open','sold_out','cancelled') then raise exception 'status inválido: %', p_status; end if;
    v_status_enum := p_status::schedule_status;
  end if;

  update public.tour_schedules
     set departure_at = coalesce(p_departure_at, departure_at),
         capacity     = coalesce(p_capacity, capacity),
         price_cents  = case
           when p_price_cents is null then price_cents
           when p_price_cents < 0 then null
           else p_price_cents end,
         status       = coalesce(v_status_enum, status),
         updated_at   = now()
   where id = p_schedule_id;

  if p_departure_at is not null and p_departure_at <> v_old_dep then
    v_diff := v_diff || jsonb_build_object('departure_at', jsonb_build_object('old', v_old_dep, 'new', p_departure_at));
  end if;
  if p_capacity is not null and p_capacity <> v_old_cap then
    v_diff := v_diff || jsonb_build_object('capacity', jsonb_build_object('old', v_old_cap, 'new', p_capacity));
  end if;
  if p_price_cents is not null and p_price_cents <> coalesce(v_old_price, -1) then
    v_diff := v_diff || jsonb_build_object('price_cents', jsonb_build_object('old', v_old_price, 'new', p_price_cents));
  end if;
  if p_status is not null and p_status <> v_old_status then
    v_diff := v_diff || jsonb_build_object('status', jsonb_build_object('old', v_old_status, 'new', p_status));
  end if;

  if v_diff <> '{}'::jsonb then
    insert into public.booking_events (booking_id, kind, payload, actor_user_id)
    select b.id, 'schedule_changed', v_diff, v_actor
      from public.bookings b
     where b.tour_schedule_id = p_schedule_id
       and b.status in ('pending_payment','confirmed');
  end if;

  return query
  select b.id, b.booking_code, c.email, v_old_dep, coalesce(p_departure_at, v_old_dep)
    from public.bookings b
    join public.customers c on c.id = b.customer_id
   where b.tour_schedule_id = p_schedule_id
     and b.status in ('pending_payment','confirmed');
end;
$$;
revoke all on function public.admin_update_tour_schedule(uuid, timestamptz, int, int, text) from public, anon, authenticated;
grant execute on function public.admin_update_tour_schedule(uuid, timestamptz, int, int, text) to authenticated;

create or replace function public.admin_delete_tour_schedule(
  p_schedule_id uuid,
  p_force       boolean default false
) returns int
language plpgsql security definer set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_active_bookings int;
begin
  if v_actor is null or not exists (select 1 from public.admins where user_id = v_actor) then
    raise exception 'forbidden: admin only';
  end if;

  select count(*) into v_active_bookings
    from public.bookings
   where tour_schedule_id = p_schedule_id and status in ('pending_payment','confirmed');

  if v_active_bookings > 0 and not p_force then
    raise exception 'schedule tem % booking(s) ativa(s). Use force=true pra cancelar e deletar', v_active_bookings;
  end if;

  if v_active_bookings > 0 then
    update public.bookings set status = 'cancelled', updated_at = now()
     where tour_schedule_id = p_schedule_id and status in ('pending_payment','confirmed');
    insert into public.booking_events (booking_id, kind, payload, actor_user_id)
    select id, 'admin_cancelled', jsonb_build_object('reason', 'schedule deleted by admin'), v_actor
      from public.bookings where tour_schedule_id = p_schedule_id;
  end if;

  delete from public.tour_schedules where id = p_schedule_id;
  return v_active_bookings;
end;
$$;
revoke all on function public.admin_delete_tour_schedule(uuid, boolean) from public, anon, authenticated;
grant execute on function public.admin_delete_tour_schedule(uuid, boolean) to authenticated;
