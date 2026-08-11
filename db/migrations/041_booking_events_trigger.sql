-- 041: log automático de booking_events via trigger.
-- Aplicada via MCP em 11/ago/2026 (migration `booking_events_trigger`).
--
-- Bug (report do admin, 11/ago): "Atividade recente" parada desde 11/maio —
-- as RPCs antigas logavam 'created'/'payment_paid' em booking_events, e os
-- upgrades (create_booking_pending atual, confirm_booking_payment_v2)
-- perderam o log. Trigger na tabela resolve pra sempre, independente de
-- qual função crie/confirme a reserva.
--
-- Escopo do trigger (só o que ninguém mais loga — evita duplicar os kinds
-- ricos que as actions já gravam: admin_cancelled, customer_cancelled,
-- refund_*, seller_created, checked_in):
--   INSERT                                  → kind 'created'
--   UPDATE pending_payment → confirmed      → kind 'payment_paid'
--
-- Validada com transação de teste (insert + update + select + ROLLBACK):
-- eventos gerados corretamente, zero resíduo.

create or replace function public.tg_log_booking_events()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if tg_op = 'INSERT' then
    insert into booking_events (booking_id, kind, payload)
    values (new.id, 'created', jsonb_build_object('status', new.status));
  elsif tg_op = 'UPDATE'
    and old.status = 'pending_payment'
    and new.status = 'confirmed' then
    insert into booking_events (booking_id, kind, payload)
    values (new.id, 'payment_paid', jsonb_build_object('total_cents', new.total_cents));
  end if;
  return new;
end;
$$;

drop trigger if exists tg_bookings_log_events on public.bookings;
create trigger tg_bookings_log_events
after insert or update of status on public.bookings
for each row execute function public.tg_log_booking_events();
