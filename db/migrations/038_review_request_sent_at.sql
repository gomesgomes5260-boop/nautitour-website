-- 038: e-mail pós-passeio pedindo avaliação no Google.
-- Aplicada via MCP em 05/ago/2026 (migration `review_request_sent_at`).
--
-- Cron novo /api/cron/reviews (13:00 UTC = 10:00 BRT) envia o pedido de
-- avaliação pra reservas confirmed/completed com saída nos últimos 3 dias.
-- Idempotência no mesmo molde da 028 (reminder_sent_at). O cron fica
-- adormecido sem a env GOOGLE_REVIEW_URL.

alter table public.bookings
  add column if not exists review_request_sent_at timestamptz;

create index if not exists bookings_review_request_pending_idx
  on public.bookings (review_request_sent_at)
  where review_request_sent_at is null and status in ('confirmed', 'completed');
