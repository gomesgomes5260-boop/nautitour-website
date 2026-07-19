-- 035_whatsapp_clicks.sql
-- ✅ APLICADA via MCP em 19/jul/2026 (projeto hpinfkvfzezuizmeqsfm).
--
-- Contagem de aberturas de chat WhatsApp "de fato redirecionadas": cada row
-- é um redirect servido pela rota /api/wa (ou registrado por server action,
-- no caso do form de locação — que abre o WhatsApp automaticamente após
-- gravar o inquiry). Alimenta o KPI "Chats WhatsApp" do dashboard admin,
-- com as mesmas janelas BRT dos demais KPIs (mês corrente / hoje).

create table if not exists public.whatsapp_clicks (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  clicked_at timestamptz not null default now()
);

create index if not exists whatsapp_clicks_clicked_at_idx
  on public.whatsapp_clicks (clicked_at desc);

alter table public.whatsapp_clicks enable row level security;
-- Sem policies de propósito: escrita/leitura só via service role (rota
-- /api/wa e dashboard admin) — nenhum acesso client-side.
