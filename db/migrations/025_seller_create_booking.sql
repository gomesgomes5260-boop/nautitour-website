-- 025_seller_create_booking.sql
-- Aplicada no projeto Supabase `uydvnjcqrfjacwburvuo` (Nutitour).
--
-- Fase 5 da fusão: RPC pra vendedor registrar reserva manual (sinal pago
-- fora do site — PIX externo/dinheiro/cartão presencial). Espelha o lock
-- FOR UPDATE e a checagem de capacidade do create_booking_pending, mas cria
-- a reserva já CONFIRMED e sem soft-hold (expires_at null — o expirador de
-- pg_cron só olha pending_payment de toda forma).

create or replace function public.seller_create_booking(
  p_schedule_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text default null,
  p_passengers jsonb default '[]'::jsonb,
  p_amount_paid_cents integer default 0,
  p_manual_payment_method text default 'pix',
  p_needs_pickup boolean default false,
  p_pickup_address text default null,
  p_pickup_room text default null,
  p_notes text default null
)
returns table(booking_id uuid, booking_code text, total_cents integer)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_auth_uid uuid := auth.uid();
  v_seller_id uuid;
  v_schedule tour_schedules%rowtype;
  v_tour tours%rowtype;
  v_customer_id uuid;
  v_booking_id uuid;
  v_booking_code text;
  v_passenger_count int;
  v_child_count int;
  v_full_count int;
  v_unit_price int;
  v_total int;
  v_email text;
begin
  v_seller_id := seller_id_for(v_auth_uid);
  if v_seller_id is null then
    raise exception 'not a seller';
  end if;

  if p_customer_name is null or p_customer_name = '' or length(p_customer_name) > 200 then
    raise exception 'customer_name is required (max 200 chars)';
  end if;
  if p_customer_phone is null or p_customer_phone = '' or length(p_customer_phone) > 32 then
    raise exception 'customer_phone is required (max 32 chars)';
  end if;
  if p_customer_email is not null and (length(p_customer_email) > 254 or position('@' in p_customer_email) = 0) then
    raise exception 'invalid customer_email';
  end if;
  if p_notes is not null and length(p_notes) > 1000 then
    raise exception 'notes too long (max 1000 chars)';
  end if;
  if p_manual_payment_method is null
     or p_manual_payment_method not in ('pix', 'cash', 'credit_card', 'debit_card') then
    raise exception 'invalid payment method';
  end if;
  if p_amount_paid_cents is null or p_amount_paid_cents < 0 then
    raise exception 'invalid amount_paid_cents';
  end if;
  if p_needs_pickup and (p_pickup_address is null or p_pickup_address = '') then
    raise exception 'pickup_address required when needs_pickup';
  end if;

  v_passenger_count := jsonb_array_length(p_passengers);
  if v_passenger_count <= 0 then
    raise exception 'at least one passenger required';
  end if;
  if v_passenger_count > 200 then
    raise exception 'too many passengers (max 200)';
  end if;

  select
    coalesce(sum(case when coalesce((p->>'is_child')::boolean, false) then 1 else 0 end), 0),
    coalesce(sum(case when coalesce((p->>'is_child')::boolean, false) then 0 else 1 end), 0)
  into v_child_count, v_full_count
  from jsonb_array_elements(p_passengers) as p;

  -- Mesmo lock do create_booking_pending: FOR UPDATE serializa contra o
  -- checkout público e evita oversell.
  select * into v_schedule from tour_schedules where id = p_schedule_id for update;
  if not found then
    raise exception 'schedule not found';
  end if;
  if v_schedule.status = 'cancelled' then
    raise exception 'schedule is cancelled';
  end if;
  if v_schedule.status = 'sold_out' then
    raise exception 'schedule is sold_out';
  end if;

  select * into v_tour from tours where id = v_schedule.tour_id;

  if v_tour.tour_type <> 'scheduled' then
    raise exception 'seller bookings only supported for scheduled tours';
  end if;
  if v_schedule.seats_taken + v_passenger_count > v_schedule.capacity then
    raise exception 'not enough seats available (% requested, % available)',
      v_passenger_count, v_schedule.capacity - v_schedule.seats_taken;
  end if;

  v_unit_price := coalesce(v_schedule.price_cents, v_tour.base_price_cents);
  if v_unit_price is null then
    raise exception 'tour has no price configured';
  end if;
  v_total := v_unit_price * v_full_count + (v_unit_price / 2) * v_child_count;

  if p_amount_paid_cents > v_total then
    raise exception 'amount_paid exceeds booking total';
  end if;

  -- Cliente pode não ter email (venda no píer). Placeholder em .invalid
  -- (RFC 2606) — inentregável por definição; fluxos de email pulam esse
  -- domínio.
  if p_customer_email is not null and p_customer_email <> '' then
    v_email := lower(p_customer_email);
    insert into customers (email, full_name, phone, is_guest)
      values (v_email, p_customer_name, p_customer_phone, true)
      on conflict (email) do update
        set full_name = coalesce(excluded.full_name, customers.full_name),
            phone = coalesce(excluded.phone, customers.phone),
            updated_at = now()
      returning id into v_customer_id;
  else
    v_email := 'sem-email+' || replace(gen_random_uuid()::text, '-', '') || '@no-email.invalid';
    insert into customers (email, full_name, phone, is_guest)
      values (v_email, p_customer_name, p_customer_phone, true)
      returning id into v_customer_id;
  end if;

  insert into bookings (
    customer_id, tour_id, tour_schedule_id,
    passenger_count, total_cents, status, notes, expires_at,
    seller_id, amount_paid_cents, manual_payment_method,
    needs_pickup, pickup_address, pickup_room
  ) values (
    v_customer_id, v_tour.id, v_schedule.id,
    v_passenger_count, v_total, 'confirmed', p_notes, null,
    v_seller_id, p_amount_paid_cents, p_manual_payment_method,
    p_needs_pickup, nullif(p_pickup_address, ''), nullif(p_pickup_room, '')
  ) returning id, bookings.booking_code into v_booking_id, v_booking_code;

  insert into booking_passengers (booking_id, full_name, document, birth_date, is_child)
  select
    v_booking_id,
    coalesce(nullif(p->>'full_name', ''), p_customer_name),
    nullif(p->>'document', ''),
    nullif(p->>'birth_date', '')::date,
    coalesce((p->>'is_child')::boolean, false)
  from jsonb_array_elements(p_passengers) as p;

  update tour_schedules
    set seats_taken = seats_taken + v_passenger_count,
        status = case when seats_taken + v_passenger_count >= capacity
                      then 'sold_out'::schedule_status else status end
    where id = v_schedule.id;

  insert into booking_events (booking_id, kind, actor_user_id, payload)
  values (
    v_booking_id, 'seller_created', v_auth_uid,
    jsonb_build_object(
      'seller_id', v_seller_id,
      'amount_paid_cents', p_amount_paid_cents,
      'manual_payment_method', p_manual_payment_method
    )
  );

  return query select v_booking_id, v_booking_code, v_total;
end;
$function$;

revoke execute on function public.seller_create_booking(uuid, text, text, text, jsonb, integer, text, boolean, text, text, text) from anon;
