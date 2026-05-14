-- Migration 021: DB hygiene — audit follow-ups
-- Aplicada via MCP Supabase (apply_migration). Esta cópia é só rastreio histórico.
--
-- Fecha warnings acionáveis do Supabase advisor identificados no audit:
--   - S3: function search_path mutable (1 trigger function)
--   - RLS initplan: 10 policies reescritas com (SELECT auth.uid())
--   - B1: 4 FK sem covering index
--   - B3: 1 duplicate index em schedule_templates
--
-- Mudanças mecânicas, sem alteração de comportamento.

-- =========================================================================
-- 1. SEARCH PATH FIX (S3)
-- =========================================================================
ALTER FUNCTION public.tg_set_default_embarkation_pier()
  SET search_path = public, pg_temp;

-- =========================================================================
-- 2. RLS INITPLAN OPTIMIZATION — substitui auth.uid() por (SELECT auth.uid())
--    em todas as policies afetadas. Mesma semântica, Postgres avalia uma vez
--    por query em vez de uma vez por linha.
-- =========================================================================

-- customers
DROP POLICY IF EXISTS customers_self_select ON public.customers;
CREATE POLICY customers_self_select ON public.customers
  FOR SELECT TO public
  USING (((SELECT auth.uid()) IS NOT NULL) AND ((SELECT auth.uid()) = auth_user_id));

DROP POLICY IF EXISTS customers_self_update ON public.customers;
CREATE POLICY customers_self_update ON public.customers
  FOR UPDATE TO public
  USING (((SELECT auth.uid()) IS NOT NULL) AND ((SELECT auth.uid()) = auth_user_id))
  WITH CHECK (((SELECT auth.uid()) IS NOT NULL) AND ((SELECT auth.uid()) = auth_user_id));

-- bookings
DROP POLICY IF EXISTS bookings_self_select ON public.bookings;
CREATE POLICY bookings_self_select ON public.bookings
  FOR SELECT TO public
  USING (
    ((SELECT auth.uid()) IS NOT NULL)
    AND (customer_id IN (
      SELECT customers.id FROM public.customers
      WHERE customers.auth_user_id = (SELECT auth.uid())
    ))
  );

-- booking_passengers
DROP POLICY IF EXISTS booking_passengers_self_select ON public.booking_passengers;
CREATE POLICY booking_passengers_self_select ON public.booking_passengers
  FOR SELECT TO public
  USING (
    ((SELECT auth.uid()) IS NOT NULL)
    AND (booking_id IN (
      SELECT b.id FROM public.bookings b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.auth_user_id = (SELECT auth.uid())
    ))
  );

-- payments
DROP POLICY IF EXISTS payments_self_select ON public.payments;
CREATE POLICY payments_self_select ON public.payments
  FOR SELECT TO public
  USING (
    ((SELECT auth.uid()) IS NOT NULL)
    AND (booking_id IN (
      SELECT b.id FROM public.bookings b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.auth_user_id = (SELECT auth.uid())
    ))
  );

-- inquiry_requests
DROP POLICY IF EXISTS inquiry_self_select ON public.inquiry_requests;
CREATE POLICY inquiry_self_select ON public.inquiry_requests
  FOR SELECT TO public
  USING (
    ((SELECT auth.uid()) IS NOT NULL)
    AND (customer_id IN (
      SELECT customers.id FROM public.customers
      WHERE customers.auth_user_id = (SELECT auth.uid())
    ))
  );

-- admins
DROP POLICY IF EXISTS admins_self_read ON public.admins;
CREATE POLICY admins_self_read ON public.admins
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS admins_owner_all ON public.admins;
CREATE POLICY admins_owner_all ON public.admins
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid()) AND a.role = 'owner'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid()) AND a.role = 'owner'
  ));

-- booking_events
DROP POLICY IF EXISTS booking_events_admin_read ON public.booking_events;
CREATE POLICY booking_events_admin_read ON public.booking_events
  FOR SELECT TO authenticated
  USING (public.is_admin((SELECT auth.uid())));

-- schedule_templates
DROP POLICY IF EXISTS schedule_templates_admin_all ON public.schedule_templates;
CREATE POLICY schedule_templates_admin_all ON public.schedule_templates
  FOR ALL TO authenticated
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

-- =========================================================================
-- 3. FK COVERING INDEXES (B1) — 4 índices para FKs sem covering
-- =========================================================================
CREATE INDEX IF NOT EXISTS admins_created_by_idx
  ON public.admins(created_by);

CREATE INDEX IF NOT EXISTS inquiry_requests_status_changed_by_idx
  ON public.inquiry_requests(status_changed_by);

CREATE INDEX IF NOT EXISTS inquiry_requests_tour_id_idx
  ON public.inquiry_requests(tour_id);

CREATE INDEX IF NOT EXISTS tour_schedules_embarkation_pier_id_idx
  ON public.tour_schedules(embarkation_pier_id);

-- =========================================================================
-- 4. DROP DUPLICATE INDEX (B3) em schedule_templates
--    Mantém schedule_templates_tour_id_weekday_departure_time_key (UNIQUE
--    constraint). Remove o índice solto idêntico.
-- =========================================================================
DROP INDEX IF EXISTS public.schedule_templates_unique_tour_day_time_idx;
