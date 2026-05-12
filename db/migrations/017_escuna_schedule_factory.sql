-- 017_escuna_schedule_factory.sql
-- Aplicada no projeto Supabase `uydvnjcqrfjacwburvuo` (Nutitour) em 2026-05-12.
--
-- ============================================================================
-- Schedule factory para o tour "escuna-publica":
--   - Sábado e domingo: 2 saídas (09:30 e 12:00 BRT)
--   - Segunda a sexta:  1 saída  (11:30 BRT)
--   - Capacidade: 120 vagas por saída
--
-- Função idempotente (ON CONFLICT DO NOTHING). pg_cron mantém pipeline cheio
-- com 90 dias à frente — roda todo dia às 06:00 UTC (03:00 BRT).
--
-- Após aplicar, executar uma vez:
--   select public.ensure_escuna_schedules(90);
--
-- E deletar saídas antigas que não correspondem ao novo schedule (11:00) e
-- não têm bookings:
--   delete from public.tour_schedules s
--   using public.tours t
--   where s.tour_id = t.id
--     and t.slug = 'escuna-publica'
--     and extract(hour from timezone('America/Sao_Paulo', s.departure_at)) = 11
--     and extract(minute from timezone('America/Sao_Paulo', s.departure_at)) = 0
--     and s.departure_at >= now()
--     and s.seats_taken = 0
--     and not exists (select 1 from public.bookings b where b.tour_schedule_id = s.id);
-- ============================================================================

-- 1. Atualiza max_capacity do tour
update public.tours
   set max_capacity = 120
 where slug = 'escuna-publica';

-- 2. Função pra popular saídas
create or replace function public.ensure_escuna_schedules(p_days_ahead int default 90)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tour_id  uuid;
  v_day      date;
  v_dow      int;
  v_times    text[];
  v_time     text;
  v_inserted int := 0;
begin
  select id into v_tour_id
    from public.tours
   where slug = 'escuna-publica'
     and active = true
   limit 1;

  if v_tour_id is null then
    return 0;
  end if;

  for v_day in
    select (current_date + i)::date
      from generate_series(0, greatest(p_days_ahead, 1) - 1) as i
  loop
    v_dow := extract(dow from v_day);  -- 0 = dom, 6 = sáb

    if v_dow in (0, 6) then
      v_times := array['09:30', '12:00'];
    else
      v_times := array['11:30'];
    end if;

    foreach v_time in array v_times loop
      insert into public.tour_schedules(tour_id, departure_at, capacity, status)
      values (
        v_tour_id,
        timezone('America/Sao_Paulo', v_day + v_time::time),
        120,
        'open'
      )
      on conflict (tour_id, departure_at) do nothing;

      if found then
        v_inserted := v_inserted + 1;
      end if;
    end loop;
  end loop;

  return v_inserted;
end;
$$;

revoke all on function public.ensure_escuna_schedules(int) from public, anon, authenticated;
grant execute on function public.ensure_escuna_schedules(int) to service_role;

-- 3. pg_cron job (idempotente — recria se já existir)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'ensure_escuna_schedules_daily') then
    perform cron.unschedule('ensure_escuna_schedules_daily');
  end if;

  perform cron.schedule(
    'ensure_escuna_schedules_daily',
    '0 6 * * *',
    $cron$ select public.ensure_escuna_schedules(90); $cron$
  );
end $$;

-- 4. Popula imediatamente
select public.ensure_escuna_schedules(90);
