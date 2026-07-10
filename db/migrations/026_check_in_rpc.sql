-- 026_check_in_rpc.sql
-- Aplicada no projeto Supabase `uydvnjcqrfjacwburvuo` (Nutitour).
--
-- Fase 6 da fusão: check-in de embarque por QR (valor do QR = booking_code).
-- Idempotente: re-scan de reserva já embarcada retorna first_checkin=false
-- sem erro — o caller usa o boolean pra não disparar payout duplicado
-- (fase 7). Guard is_admin; EXECUTE revogado do anon.

create or replace function public.admin_check_in_booking(p_booking_code text)
returns table(first_checkin boolean, booking_id uuid)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_auth_uid uuid := auth.uid();
  v_booking bookings%rowtype;
begin
  if not is_admin(v_auth_uid) then
    raise exception 'not an admin';
  end if;

  select * into v_booking from bookings where bookings.booking_code = p_booking_code for update;
  if not found then
    raise exception 'booking not found';
  end if;

  if v_booking.status = 'pending_payment' then
    raise exception 'booking not paid';
  end if;
  if v_booking.status in ('cancelled', 'refunded') then
    raise exception 'booking cancelled';
  end if;
  if v_booking.status = 'completed' then
    return query select false, v_booking.id;
    return;
  end if;

  update bookings
    set status = 'completed',
        checked_in_at = now(),
        checked_in_by = v_auth_uid,
        updated_at = now()
    where id = v_booking.id;

  insert into booking_events (booking_id, kind, actor_user_id, payload)
  values (v_booking.id, 'checked_in', v_auth_uid, jsonb_build_object('booking_code', p_booking_code));

  return query select true, v_booking.id;
end;
$function$;

revoke execute on function public.admin_check_in_booking(text) from anon;
