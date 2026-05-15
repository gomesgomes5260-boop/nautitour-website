-- Migration 022: RPC create_lead_invitation
-- Aplicada via MCP Supabase (apply_migration). Esta cópia é só rastreio
-- histórico (convenção do projeto).
--
-- Objetivo: capturar email de visitantes que abandonam checkout pra futuro
-- envio de email "complete sua reserva". Tabela lead_invitations já existe
-- desde a migration 005 — esta migration adiciona apenas:
--   1. Coluna source (opcional) pra rastrear origem do lead
--   2. RPC create_lead_invitation com upsert idempotente de customer + token

-- =========================================================================
-- 1. Coluna source (opcional)
-- =========================================================================
ALTER TABLE public.lead_invitations
  ADD COLUMN IF NOT EXISTS source text;

-- =========================================================================
-- 2. RPC create_lead_invitation
-- =========================================================================
-- Argumentos:
--   p_email      text     — obrigatório (lowercased, format validation)
--   p_full_name  text     — opcional
--   p_phone      text     — opcional
--   p_source     text     — opcional (ex: 'checkout_abandon', 'inquiry_form')
--
-- Retorna:
--   token        text     — invitation token (base64url, ~32 chars)
--   was_new      boolean  — true se criou nova invitation, false se reusou existente
--
-- Lógica:
--   1. Valida formato do email (LIKE simples — regex completo seria overkill)
--   2. UPSERT customer (is_guest=true) por email — reusa se já existe
--   3. Checa se já existe lead_invitation ATIVA pra esse customer
--      (used_at IS NULL AND expires_at > now())
--      → se sim, retorna o token existente (idempotente)
--   4. Senão, gera token via encode(gen_random_bytes(24), 'base64')
--      (com replace pra urlsafe) e insere com expires_at = now() + 30 days

CREATE OR REPLACE FUNCTION public.create_lead_invitation(
  p_email text,
  p_full_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_source text DEFAULT NULL
)
RETURNS TABLE(token text, was_new boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text;
  v_customer_id uuid;
  v_existing_token text;
  v_new_token text;
BEGIN
  -- Normaliza + valida
  v_email := lower(trim(p_email));
  IF v_email IS NULL OR length(v_email) < 5 OR v_email NOT LIKE '%_@_%.__%' THEN
    RAISE EXCEPTION 'Invalid email format' USING ERRCODE = '22023';
  END IF;
  IF length(v_email) > 254 THEN
    RAISE EXCEPTION 'Email too long' USING ERRCODE = '22023';
  END IF;

  -- UPSERT customer (idempotente por email)
  INSERT INTO public.customers (email, full_name, phone, is_guest)
  VALUES (v_email, nullif(trim(coalesce(p_full_name, '')), ''), nullif(trim(coalesce(p_phone, '')), ''), true)
  ON CONFLICT (email) DO UPDATE
    SET full_name = COALESCE(public.customers.full_name, EXCLUDED.full_name),
        phone     = COALESCE(public.customers.phone, EXCLUDED.phone)
  RETURNING id INTO v_customer_id;

  -- Existe invitation ativa? Reusa.
  SELECT li.token INTO v_existing_token
  FROM public.lead_invitations li
  WHERE li.customer_id = v_customer_id
    AND li.used_at IS NULL
    AND li.expires_at > now()
  ORDER BY li.created_at DESC
  LIMIT 1;

  IF v_existing_token IS NOT NULL THEN
    RETURN QUERY SELECT v_existing_token, false;
    RETURN;
  END IF;

  -- Gera token urlsafe (~32 chars, ~144 bits de entropia)
  v_new_token := replace(replace(replace(encode(gen_random_bytes(24), 'base64'), '+', '-'), '/', '_'), '=', '');

  INSERT INTO public.lead_invitations (customer_id, token, expires_at, source)
  VALUES (v_customer_id, v_new_token, now() + interval '30 days', p_source);

  RETURN QUERY SELECT v_new_token, true;
END;
$$;

-- Grants — anon (checkout não-logado) + authenticated (usuário já logado)
GRANT EXECUTE ON FUNCTION public.create_lead_invitation(text, text, text, text) TO anon, authenticated;

-- =========================================================================
-- 3. Index pra lookup eficiente
-- =========================================================================
-- Procura por invitation ativa por customer_id é o caminho quente.
CREATE INDEX IF NOT EXISTS lead_invitations_active_by_customer_idx
  ON public.lead_invitations(customer_id, expires_at)
  WHERE used_at IS NULL;
