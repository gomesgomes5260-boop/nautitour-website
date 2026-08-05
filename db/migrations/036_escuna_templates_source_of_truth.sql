-- 036: templates viram a única fonte da grade da escuna.
-- Aplicada via MCP em 05/ago/2026 (migration `escuna_templates_source_of_truth`).
--
-- Contexto (04-05/ago): o site mostrava saídas duplicadas (11:00 cap 60 todos
-- os dias + 11:30 cap 60 sáb/dom) geradas por generate_future_schedules a
-- partir de templates antigos, convivendo com a grade fixa de
-- ensure_escuna_schedules (hardcoded: seg-sex 11:30, sáb/dom 09:30+12:00,
-- cap 120). Edições na tela /admin/config de templates "não mudavam nada"
-- porque as fábricas só inserem — nunca apagam/atualizam saídas já criadas —
-- e a fábrica hardcoded recriava a grade fixa todo dia.
--
-- Grade canônica (decisão do user): seg-sex 11:30 · sáb/dom 09:30 + 12:00 ·
-- capacidade 120.

-- 1) Apaga as saídas futuras erradas (verificado: zero bookings em qualquer
--    status nessas 36 saídas).
delete from public.tour_schedules ts
using public.tours t
where t.id = ts.tour_id
  and t.slug = 'escuna-publica'
  and ts.departure_at > now()
  and ts.status <> 'cancelled'
  and (
    to_char(ts.departure_at at time zone 'America/Sao_Paulo', 'HH24:MI') = '11:00'
    or (
      to_char(ts.departure_at at time zone 'America/Sao_Paulo', 'HH24:MI') = '11:30'
      and extract(dow from ts.departure_at at time zone 'America/Sao_Paulo') in (0, 6)
    )
  );

-- 2) Templates da escuna espelham a grade canônica.
-- seg-sex 11:30 → capacidade 120 (estava 60)
update public.schedule_templates st
set capacity = 120, updated_at = now()
from public.tours t
where t.id = st.tour_id
  and t.slug = 'escuna-publica'
  and st.weekday between 1 and 5;

-- sáb/dom: remove o template 11:30 e cria 09:30 + 12:00 cap 120
delete from public.schedule_templates st
using public.tours t
where t.id = st.tour_id
  and t.slug = 'escuna-publica'
  and st.weekday in (0, 6);

insert into public.schedule_templates (tour_id, weekday, departure_time, capacity, active)
select t.id, w.weekday, tm.dep::time, 120, true
from public.tours t
cross join (values (0), (6)) as w(weekday)
cross join (values ('09:30'), ('12:00')) as tm(dep)
where t.slug = 'escuna-publica';

-- 3) Uma fábrica só: desliga o cron da hardcoded e estende a de templates
--    pra manter os mesmos 90 dias de horizonte. A função
--    ensure_escuna_schedules fica no banco (dormant) como rollback.
select cron.unschedule('ensure_escuna_schedules_daily');
select cron.unschedule('generate_future_schedules_daily');
select cron.schedule(
  'generate_future_schedules_daily',
  '0 6 * * *',
  $$ select public.generate_future_schedules(90); $$
);

-- 4) Regenera o horizonte já com os templates corretos (on conflict ignora
--    as saídas que já existem).
select public.generate_future_schedules(90);
