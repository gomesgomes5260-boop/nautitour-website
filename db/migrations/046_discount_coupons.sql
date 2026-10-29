-- 046_discount_coupons.sql
-- Cupons de desconto no checkout (decisão 29/out).
--
-- 5 matemáticas (enum coupon_tipo):
--   percent_total    — % sobre o total (floor)
--   valor_total      — R$ fixo de desconto no total
--   valor_por_pessoa — R$ por inteira (meia leva metade do valor, truncado)
--   preco_por_pessoa — preço promocional por inteira (meia = metade do promo);
--                      desconto = total normal − total promo
--   nth_pessoa       — regra progressiva nas INTEIRAS: a cada `nth` inteiras
--                      (ou só na primeira vez, se nth_repete=false) uma delas
--                      ganha `percent`% OU `valor_cents` de desconto.
--                      Ex.: "a partir de 2 inteiras a 3ª sai pela metade" =
--                      nth=3, percent=50 · "compre 1 e a 2ª ganha R$10" =
--                      nth=2, valor_cents=1000.
--
-- Pontos de segurança:
--   * Toda a matemática é server-side (mesma função usada pelo preview do
--     checkout e pelo create_booking_pending — o cliente nunca manda valor).
--   * Claim atômico: FOR UPDATE no cupom dentro do create_booking_pending,
--     usos+1 na mesma transação; max_usos nunca estoura em corrida.
--   * Devolução de uso: trigger em bookings devolve o uso quando uma reserva
--     pending_payment com cupom vira cancelled (expiração do pg_cron,
--     cancelamento do cliente ou do admin — todos passam por esse UPDATE).
--     Reserva confirmada que depois cancela NÃO devolve o uso.
--   * Total final mínimo de R$ 1,00 (clamp do desconto, igual no preview e
--     na criação) — nunca gera cobrança zerada no Pagar.me.
--   * Escrita de cupom é owner-only (RLS); operador só lê.
--
-- create_booking_pending ganhou p_coupon_code text default null (DROP+CREATE
-- pra não criar overload ambíguo; callers antigos de 7 args seguem válidos).

-- 1) Enum + tabela -----------------------------------------------------------

create type public.coupon_tipo as enum (
  'percent_total', 'valor_total', 'valor_por_pessoa', 'preco_por_pessoa', 'nth_pessoa'
);

create table public.discount_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9][A-Z0-9-]{2,29}$'),
  descricao text,
  tipo public.coupon_tipo not null,
  percent numeric(5,2) check (percent > 0 and percent <= 100),
  valor_cents integer check (valor_cents > 0),
  nth integer check (nth >= 2),
  nth_repete boolean not null default true,
  min_pax integer not null default 1 check (min_pax >= 1),
  min_inteiras integer not null default 0 check (min_inteiras >= 0),
  valido_de timestamptz,
  valido_ate timestamptz,
  max_usos integer check (max_usos > 0),
  usos integer not null default 0 check (usos >= 0),
  ativo boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Cada tipo exige exatamente os parâmetros que usa.
  constraint coupon_params_por_tipo check (
    case tipo
      when 'percent_total' then percent is not null and valor_cents is null and nth is null
      when 'nth_pessoa' then nth is not null
        and ((percent is not null) <> (valor_cents is not null))
      else valor_cents is not null and percent is null and nth is null
    end
  )
);

create trigger set_updated_at
  before update on public.discount_coupons
  for each row execute function public.set_updated_at();

alter table public.discount_coupons enable row level security;

create policy coupons_admin_select on public.discount_coupons
  for select to authenticated
  using (public.is_admin((select auth.uid())));

create policy coupons_owner_write on public.discount_coupons
  for all to authenticated
  using (exists (
    select 1 from public.admins a
    where a.user_id = (select auth.uid()) and a.role = 'owner'
  ))
  with check (exists (
    select 1 from public.admins a
    where a.user_id = (select auth.uid()) and a.role = 'owner'
  ));

-- 2) Colunas na reserva ------------------------------------------------------

alter table public.bookings
  add column coupon_code text,
  add column discount_cents integer not null default 0 check (discount_cents >= 0);

-- 3) Matemática única (preview E criação usam a mesma função) ----------------

create or replace function public.coupon_discount_cents(
  c public.discount_coupons, p_inteiras int, p_meias int, p_unit_price int
) returns int
language plpgsql immutable
as $$
declare
  v_total int := p_unit_price * p_inteiras + (p_unit_price / 2) * p_meias;
  v_desc int := 0;
  v_n int;
  v_unit_desc int;
begin
  case c.tipo
    when 'percent_total' then
      v_desc := floor(v_total * c.percent / 100)::int;
    when 'valor_total' then
      v_desc := c.valor_cents;
    when 'valor_por_pessoa' then
      v_desc := c.valor_cents * p_inteiras + (c.valor_cents / 2) * p_meias;
    when 'preco_por_pessoa' then
      -- total promo no lugar do total normal; meia = metade do promo (trunc)
      v_desc := v_total - (c.valor_cents * p_inteiras + (c.valor_cents / 2) * p_meias);
    when 'nth_pessoa' then
      if c.nth_repete then
        v_n := p_inteiras / c.nth;
      else
        v_n := case when p_inteiras >= c.nth then 1 else 0 end;
      end if;
      if c.percent is not null then
        v_unit_desc := floor(p_unit_price * c.percent / 100)::int;
      else
        v_unit_desc := least(c.valor_cents, p_unit_price);
      end if;
      v_desc := v_n * v_unit_desc;
  end case;
  return greatest(0, least(coalesce(v_desc, 0), v_total));
end;
$$;

-- 4) Validação (mensagem PT pro cliente, NULL = ok) --------------------------

create or replace function public.coupon_check(
  c public.discount_coupons, p_inteiras int, p_meias int
) returns text
language plpgsql stable
as $$
begin
  if not c.ativo then
    return 'Cupom inválido.';
  end if;
  if c.valido_de is not null and now() < c.valido_de then
    return 'Este cupom ainda não está valendo.';
  end if;
  if c.valido_ate is not null and now() > c.valido_ate then
    return 'Este cupom expirou.';
  end if;
  if c.max_usos is not null and c.usos >= c.max_usos then
    return 'Este cupom já atingiu o limite de usos.';
  end if;
  if p_inteiras + p_meias < c.min_pax then
    return format('Este cupom vale a partir de %s passageiros.', c.min_pax);
  end if;
  if p_inteiras < c.min_inteiras then
    return format('Este cupom vale a partir de %s passagens inteiras.', c.min_inteiras);
  end if;
  return null;
end;
$$;

-- 5) Preview pro box do checkout (anon pode chamar; não consome uso) ---------

create or replace function public.preview_coupon_discount(
  p_schedule_id uuid, p_code text, p_inteiras int, p_meias int
) returns table (
  valido boolean,
  motivo text,
  desconto_cents int,
  total_bruto_cents int,
  total_liquido_cents int,
  descricao text
)
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_schedule tour_schedules%rowtype;
  v_tour tours%rowtype;
  v_unit int;
  v_total int;
  v_c discount_coupons%rowtype;
  v_msg text;
  v_desc int;
begin
  if p_inteiras is null or p_meias is null or p_inteiras < 0 or p_meias < 0
     or p_inteiras + p_meias <= 0 or p_inteiras + p_meias > 200 then
    return query select false, 'Passageiros inválidos.', 0, 0, 0, null::text;
    return;
  end if;

  select * into v_schedule from tour_schedules where id = p_schedule_id;
  if not found then
    return query select false, 'Saída não encontrada.', 0, 0, 0, null::text;
    return;
  end if;
  select * into v_tour from tours where id = v_schedule.tour_id;
  if v_tour.tour_type <> 'scheduled' then
    return query select false, 'Cupom não se aplica a este passeio.', 0, 0, 0, null::text;
    return;
  end if;

  v_unit := coalesce(v_schedule.price_cents, v_tour.base_price_cents);
  if v_unit is null then
    return query select false, 'Passeio sem preço configurado.', 0, 0, 0, null::text;
    return;
  end if;
  v_total := v_unit * p_inteiras + (v_unit / 2) * p_meias;

  select * into v_c from discount_coupons where code = upper(trim(p_code));
  if not found then
    return query select false, 'Cupom inválido.', 0, v_total, v_total, null::text;
    return;
  end if;

  v_msg := coupon_check(v_c, p_inteiras, p_meias);
  if v_msg is not null then
    return query select false, v_msg, 0, v_total, v_total, v_c.descricao;
    return;
  end if;

  v_desc := coupon_discount_cents(v_c, p_inteiras, p_meias, v_unit);
  v_desc := least(v_desc, greatest(v_total - 100, 0)); -- total final >= R$ 1,00
  if v_desc <= 0 then
    return query select false, 'Este cupom não se aplica a esta reserva.', 0, v_total, v_total, v_c.descricao;
    return;
  end if;

  return query select true, null::text, v_desc, v_total, v_total - v_desc, v_c.descricao;
end;
$$;

-- 6) create_booking_pending ganha p_coupon_code ------------------------------
-- DROP em vez de CREATE OR REPLACE com assinatura nova: evita ficar com as
-- duas versões (overload) e chamada ambígua via PostgREST.

drop function public.create_booking_pending(uuid, text, text, text, text, jsonb, text);

create function public.create_booking_pending(
  p_schedule_id uuid,
  p_email text,
  p_full_name text,
  p_phone text,
  p_cpf text default null::text,
  p_passengers jsonb default '[]'::jsonb,
  p_notes text default null::text,
  p_coupon_code text default null::text
)
returns table(booking_id uuid, booking_code text, total_cents integer)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_auth_uid uuid := auth.uid();
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
  v_expires_at timestamptz;
  v_coupon discount_coupons%rowtype;
  v_coupon_msg text;
  v_coupon_code text;
  v_discount int := 0;
begin
  if p_email is null or p_email = '' or length(p_email) > 254 then
    raise exception 'email is required (max 254 chars)';
  end if;
  if p_full_name is null or p_full_name = '' or length(p_full_name) > 200 then
    raise exception 'full_name is required (max 200 chars)';
  end if;
  if p_phone is not null and length(p_phone) > 32 then
    raise exception 'phone too long (max 32 chars)';
  end if;
  if p_cpf is not null and length(p_cpf) > 32 then
    raise exception 'cpf too long (max 32 chars)';
  end if;
  if p_notes is not null and length(p_notes) > 1000 then
    raise exception 'notes too long (max 1000 chars)';
  end if;

  v_passenger_count := jsonb_array_length(p_passengers);
  if v_passenger_count <= 0 then
    raise exception 'at least one passenger required';
  end if;
  if v_passenger_count > 200 then
    raise exception 'too many passengers (max 200)';
  end if;

  -- Conta meias e inteiras a partir do JSON. Default is_child=false.
  select
    coalesce(sum(case when coalesce((p->>'is_child')::boolean, false) then 1 else 0 end), 0),
    coalesce(sum(case when coalesce((p->>'is_child')::boolean, false) then 0 else 1 end), 0)
  into v_child_count, v_full_count
  from jsonb_array_elements(p_passengers) as p;

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

  if v_passenger_count > v_schedule.capacity then
    raise exception 'too many passengers (max %)', v_schedule.capacity;
  end if;
  if v_tour.tour_type = 'scheduled' and
     v_schedule.seats_taken + v_passenger_count > v_schedule.capacity then
    raise exception 'not enough seats available (% requested, % available)',
      v_passenger_count, v_schedule.capacity - v_schedule.seats_taken;
  end if;

  v_unit_price := coalesce(v_schedule.price_cents, v_tour.base_price_cents);
  if v_unit_price is null then
    raise exception 'tour has no price configured';
  end if;
  if v_tour.tour_type = 'private' then
    -- Private: preço de slot fixo, ignora composição inteira/meia.
    v_total := v_unit_price;
  else
    -- Scheduled: meia = floor(preço/2). Mantém integer cents.
    v_total := v_unit_price * v_full_count + (v_unit_price / 2) * v_child_count;
  end if;

  -- Cupom: claim atômico (FOR UPDATE + usos+1 na mesma transação). A ordem de
  -- lock é sempre schedule -> cupom (único caminho de escrita), sem deadlock.
  if p_coupon_code is not null and trim(p_coupon_code) <> '' then
    if v_tour.tour_type <> 'scheduled' then
      raise exception 'Cupom não se aplica a este passeio.';
    end if;
    select * into v_coupon from discount_coupons
      where code = upper(trim(p_coupon_code)) for update;
    if not found then
      raise exception 'Cupom inválido.';
    end if;
    v_coupon_msg := coupon_check(v_coupon, v_full_count, v_child_count);
    if v_coupon_msg is not null then
      raise exception '%', v_coupon_msg;
    end if;
    v_discount := coupon_discount_cents(v_coupon, v_full_count, v_child_count, v_unit_price);
    v_discount := least(v_discount, greatest(v_total - 100, 0)); -- total final >= R$ 1,00
    if v_discount <= 0 then
      raise exception 'Este cupom não se aplica a esta reserva.';
    end if;
    update discount_coupons set usos = usos + 1 where id = v_coupon.id;
    v_coupon_code := v_coupon.code;
    v_total := v_total - v_discount;
  end if;

  if v_auth_uid is not null then
    select id into v_customer_id from customers where auth_user_id = v_auth_uid;
    if v_customer_id is null then
      raise exception 'authenticated user has no customer record';
    end if;
    update customers
      set full_name = coalesce(p_full_name, full_name),
          phone = coalesce(p_phone, phone),
          cpf = coalesce(p_cpf, cpf),
          updated_at = now()
      where id = v_customer_id;
  else
    insert into customers (email, full_name, phone, cpf, is_guest)
      values (lower(p_email), p_full_name, p_phone, p_cpf, true)
      on conflict (email) do update
        set full_name = coalesce(excluded.full_name, customers.full_name),
            phone = coalesce(excluded.phone, customers.phone),
            cpf = coalesce(excluded.cpf, customers.cpf),
            updated_at = now()
      returning id into v_customer_id;
  end if;

  v_expires_at := case when v_tour.tour_type = 'scheduled'
                       then now() + interval '10 minutes'
                       else null end;

  insert into bookings (
    customer_id, tour_id, tour_schedule_id,
    passenger_count, total_cents, status, notes, expires_at,
    coupon_code, discount_cents
  ) values (
    v_customer_id, v_tour.id, v_schedule.id,
    v_passenger_count, v_total, 'pending_payment', p_notes, v_expires_at,
    v_coupon_code, v_discount
  ) returning id, bookings.booking_code into v_booking_id, v_booking_code;

  insert into booking_passengers (booking_id, full_name, document, birth_date, is_child)
  select
    v_booking_id,
    coalesce(nullif(p->>'full_name', ''), p_full_name),
    nullif(p->>'document', ''),
    nullif(p->>'birth_date', '')::date,
    coalesce((p->>'is_child')::boolean, false)
  from jsonb_array_elements(p_passengers) as p;

  if v_tour.tour_type = 'scheduled' then
    update tour_schedules
      set seats_taken = seats_taken + v_passenger_count,
          status = case when seats_taken + v_passenger_count >= capacity
                        then 'sold_out'::schedule_status else status end
      where id = v_schedule.id;
  elsif v_tour.tour_type = 'private' then
    update tour_schedules
      set seats_taken = capacity,
          status = 'sold_out'
      where id = v_schedule.id;
  end if;

  return query select v_booking_id, v_booking_code, v_total;
end;
$function$;

-- 7) Devolução do uso quando a reserva pendente morre ------------------------
-- Cobre num ponto só: expire_pending_bookings (pg_cron), customer_cancel_booking
-- e admin_cancel_booking — todos viram UPDATE status pending_payment->cancelled.

create or replace function public.tg_release_coupon_use()
returns trigger
language plpgsql security definer
set search_path to 'public'
as $$
begin
  update discount_coupons set usos = greatest(0, usos - 1)
    where code = old.coupon_code;
  return new;
end;
$$;

create trigger tg_bookings_release_coupon
  after update of status on public.bookings
  for each row
  when (old.status = 'pending_payment' and new.status = 'cancelled'
        and old.coupon_code is not null)
  execute function public.tg_release_coupon_use();
