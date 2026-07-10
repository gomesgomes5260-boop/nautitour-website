-- 028_booking_reminders.sql
-- Aplicada no projeto Supabase `uydvnjcqrfjacwburvuo` (Nutitour).
--
-- Fase 8 da fusão: lembrete D-1 por email (Vercel Cron + Resend).
-- reminder_sent_at marca envio (idempotência); índice parcial cobre a
-- query diária do cron.

alter table public.bookings
  add column if not exists reminder_sent_at timestamptz;

create index if not exists bookings_reminder_pending_idx
  on public.bookings (reminder_sent_at)
  where reminder_sent_at is null and status = 'confirmed';
