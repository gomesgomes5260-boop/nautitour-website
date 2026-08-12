-- Migration 042: corrige `gen_random_bytes does not exist`
-- Aplicada via MCP Supabase (apply_migration). Esta cópia é só rastreio
-- histórico (convenção do projeto).
--
-- Sintoma (produção, 12/ago/2026, visto nos logs do Vercel):
--   [captureLeadAction] rpc error 42883:
--   function gen_random_bytes(integer) does not exist
--
-- Causa: a extensão pgcrypto vive no schema `extensions` (padrão Supabase),
-- mas o search_path dessas funções SECURITY DEFINER não o inclui —
--   create_lead_invitation:            search_path = public, pg_temp
--   admin_convert_inquiry_to_booking:  search_path = public, pg_catalog
-- então `gen_random_bytes` (usado pra gerar tokens) fica inacessível dentro
-- delas. Efeito colateral da migração pro projeto sa-east-1 (18/jul).
--
-- Fix: adiciona `extensions` ao search_path de cada função, sem reescrever o
-- corpo (risco mínimo, sem drift). Mantém os schemas já configurados.

ALTER FUNCTION public.create_lead_invitation(text, text, text, text)
  SET search_path = public, extensions, pg_temp;

ALTER FUNCTION public.admin_convert_inquiry_to_booking(uuid, integer, timestamptz)
  SET search_path = public, extensions, pg_catalog;
