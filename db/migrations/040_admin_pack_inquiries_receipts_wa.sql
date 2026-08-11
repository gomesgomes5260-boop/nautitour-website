-- 040: pacote admin — histórico de inquéritos, comprovante de comissão e
-- rastreio do número de WhatsApp direcionado.
-- Aplicada via MCP em 05/ago/2026 (migration `admin_pack_inquiries_receipts_wa`).

-- 1) Histórico de mudança de status dos inquéritos (Requerimentos).
--    Escrita/leitura só via service role (RLS ligada, sem policies).
create table if not exists public.inquiry_events (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiry_requests(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_email text,
  created_at timestamptz not null default now()
);
create index if not exists inquiry_events_inquiry_idx
  on public.inquiry_events (inquiry_id, created_at);
alter table public.inquiry_events enable row level security;

-- 2) Número de WhatsApp pro qual o cliente foi direcionado (rodízio).
alter table public.inquiry_requests add column if not exists wa_number text;
alter table public.whatsapp_clicks add column if not exists wa_number text;

-- 3) Origem do inquérito: 'site' (form) ou 'manual' (operador no admin).
alter table public.inquiry_requests
  add column if not exists created_via text not null default 'site';

-- 4) Comprovante do pagamento de comissão (1 por payout) + bucket privado.
alter table public.seller_payouts add column if not exists receipt_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'commission-receipts', 'commission-receipts', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;
