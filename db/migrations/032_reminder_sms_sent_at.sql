-- 032: canal SMS do lembrete D-1 (Comtele) — idempotência independente do
-- canal de e-mail (reminder_sent_at, migration 028).
-- Aplicada via MCP em 17/jul/2026. Este arquivo é documentação (não executável
-- pelo app) — ver db/migrations/README.md.
-- ⚠️ REVERTIDA pela migration 033 (17/jul): canal SMS removido do projeto,
-- notificações voltaram a ser e-mail-only.

alter table public.bookings
  add column if not exists reminder_sms_sent_at timestamptz;

create index if not exists bookings_reminder_sms_pending_idx
  on public.bookings (reminder_sms_sent_at)
  where reminder_sms_sent_at is null and status = 'confirmed';
