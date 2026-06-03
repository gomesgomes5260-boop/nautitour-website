-- Migration 023 — Integração com painel Nautitour (webreservas.xyz)
--
-- Aplicada via Supabase MCP. Este arquivo é só doc histórica.
--
-- 1) Tracking columns em bookings pra registrar o resultado do sync:
--    nautitour_booking_id (cuid do painel → valor do QR de embarque)
--    nautitour_code       (NTR-YYYYMMDD-NNN → número da reserva pro cliente)
--    nautitour_ticket_url (URL pública do ticket completo no painel)
--    nautitour_synced_at / nautitour_sync_failed_at / nautitour_sync_error
--
-- 2) Atualiza create_booking_pending pra cobrar meia entrada (50%) por
--    passageiro marcado is_child=true. Antes: total = passenger_count * preço.
--    Agora: total = adultos * preço + crianças * floor(preço/2).
--    Mantém comportamento de tours private (slot fixo).

-- ===== Tracking columns =====
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS nautitour_booking_id   text,
  ADD COLUMN IF NOT EXISTS nautitour_code         text,
  ADD COLUMN IF NOT EXISTS nautitour_ticket_url   text,
  ADD COLUMN IF NOT EXISTS nautitour_synced_at    timestamptz,
  ADD COLUMN IF NOT EXISTS nautitour_sync_failed_at timestamptz,
  ADD COLUMN IF NOT EXISTS nautitour_sync_error   text;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_nautitour_booking_id_key
  ON public.bookings (nautitour_booking_id)
  WHERE nautitour_booking_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_nautitour_code_key
  ON public.bookings (nautitour_code)
  WHERE nautitour_code IS NOT NULL;

COMMENT ON COLUMN public.bookings.nautitour_booking_id IS 'cuid retornado pelo painel webreservas.xyz — valor do QR de embarque';
COMMENT ON COLUMN public.bookings.nautitour_code IS 'Código NTR-YYYYMMDD-NNN do painel — número da reserva exposto ao cliente';
COMMENT ON COLUMN public.bookings.nautitour_ticket_url IS 'URL pública do ticket completo (PDF/impressão) no painel';

-- ===== Half-price calc =====
-- Função full re-escrita; diff principal é o cálculo de v_total. Veja
-- o histórico via pg_get_functiondef no Supabase.

-- (corpo completo aplicado via MCP — ver função pública create_booking_pending)
