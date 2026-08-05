-- 039: envio efetivo do e-mail de recuperação de lead (checkout abandonado).
-- Aplicada via MCP em 05/ago/2026 (migration `lead_recovery_sent_at`).
--
-- A captura existe desde a migration 022 (create_lead_invitation, PR #68);
-- o envio esperava o domínio verificado no Resend. Cron novo
-- /api/cron/lead-recovery (de hora em hora, minuto 30) envia UM e-mail
-- "complete sua reserva" pra leads de 1-48h atrás sem reserva não-cancelada
-- posterior à captura. Idempotência no molde padrão.

alter table public.lead_invitations
  add column if not exists recovery_email_sent_at timestamptz;

create index if not exists lead_invitations_recovery_pending_idx
  on public.lead_invitations (created_at)
  where recovery_email_sent_at is null and used_at is null;
