-- 029_drop_nautitour_columns.sql
-- ✅ APLICADA via MCP em 18/jul/2026 (autorização do user: "desligar o app
-- reservas"). Aplicada FORA de ordem (depois da 033).
--
-- Fase 9 da fusão: remove as colunas de sync com o painel externo
-- webreservas.xyz (nautitour-reservas), morto desde o PR #88. As colunas
-- só guardam metadados de sync de reservas antigas — nenhum código lê elas
-- desde a fase 2.
--
-- Aplicar via MCP `apply_migration` SOMENTE depois de:
--   1. Confirmação do usuário (drop é destrutivo/irreversível), e
--   2. Um período de observação do check-in interno funcionando em produção
--      (rollback do PR #88 deixaria de ser possível após o drop).

alter table public.bookings
  drop column if exists nautitour_booking_id,
  drop column if exists nautitour_code,
  drop column if exists nautitour_ticket_url,
  drop column if exists nautitour_synced_at,
  drop column if exists nautitour_sync_failed_at,
  drop column if exists nautitour_sync_error;
