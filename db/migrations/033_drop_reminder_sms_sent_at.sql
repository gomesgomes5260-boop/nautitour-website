-- 033: remove o canal SMS (decisão 17/jul — simplificar pra e-mail-only).
-- Reverte a migration 032: a coluna nunca foi usada em produção
-- (COMTELE_API_KEY nunca configurada), drop seguro.
-- Aplicada via MCP em 17/jul/2026. Este arquivo é documentação.

drop index if exists public.bookings_reminder_sms_pending_idx;

alter table public.bookings
  drop column if exists reminder_sms_sent_at;
