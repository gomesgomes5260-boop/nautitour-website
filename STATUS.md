# Nautitour — Status do Projeto

Última atualização: **13/maio/2026** — Tiers 0–2 concluídos, Tier 3 parcial (Q+R mergeadas), **rebrand visual oficial aplicado**, **sistema de píeres de embarque** ativo, **CRUD completo de horários e templates no admin** com notificação automática por e-mail.

**Legenda:** ✅ pronto · 🟡 parcial · 🔴 falta · ⏸️ bloqueado por dependência externa

---

## 📌 Estado atual (13/maio)

### Site em produção
- **URL**: https://nautitour-website.vercel.app (modo Pagar.me `live`)
- **Cliente**: Nautitour Passeios — **Armação dos Búzios, RJ** (não confundir com Maragogi/Arraial do Cabo)
- **Pier de embarque padrão**: Píer da Rua das Pedras (sem taxa). 2 alternativos: Porto Veleiro e Pescador (R$ 10/pax presencial)
- **Escuna pública**: Sáb/Dom 09:30 + 12:00 · Seg–Sex 11:30 · capacidade 120 · duração 2h30 · R$ 60/pax
- **Lancha privativa**: schedule manual (via inquiry → admin cria booking 1-click ou cria saída avulsa)

### Backend Tier 3 — 2/5 PRs mergeadas

| PR | Item | Status |
|---|---|---|
| ✅ Q | Captcha Cloudflare Turnstile + rate limit Upstash em checkout/inquiry/payment/auth | Mergeada (#24) |
| ✅ R | Sentry + PII scrubbing + tunnel route /monitoring | Mergeada (#25) |
| 🔴 S | CSP report-only + Origin check signout + HSTS preload | Pendente |
| 🔴 T | Refund parcial UI (backend já aceita amountCents opcional) | Pendente |
| 🔴 U | Paginação `/admin/clientes` (substituir slice(0,50)) | Pendente |

### PR-Final — bloqueada por DNS mpjunior
Swap apex `nautitour.com.br` pro Vercel + verificar domínio Resend + lead recapture.

### UI/UX rebrand visual — completo
Brand guide oficial (charcoal+red, Fraunces+Montserrat+JetBrains Mono) aplicado em:
- ✅ Header / Footer com logo PNG real (extraída via `scripts/extract-logo-variants.mjs`)
- ✅ Home (hero drone-tartaruga + tour cards + how-to-book + why-choose-us + CTA)
- ✅ `/passeio-escuna` + `/passeio-lancha` com calendário interativo + sticky card
- ✅ Admin sidebar dark (`/admin/*`) + dashboard overview com KPIs coloridos
- 🟡 Páginas internas remanescentes (`/checkout`, `/reserva`, `/login`, `/signup`, `/admin/reservas`, `/admin/financeiro`, `/admin/inquiries`, `/admin/clientes`) — herdam novo layout (sidebar + bg) mas conteúdo interno ainda com classes legacy

### Embarkation piers (PR #43)
3 píeres seedados em `embarkation_piers`:
- **rua-pedras** (default, R$ 0)
- **porto-veleiro** (R$ 10/pax presencial)
- **pier-pescador** (R$ 10/pax presencial)

Admin troca o píer de uma saída em `/admin/manifesto/[scheduleId]` via `PierSelect`. Cliente vê o píer + taxa em 4 touchpoints (calendário, checkout, página de reserva, e-mail de confirmação).

### Schedule CRUD modular (PRs #44 + #45)
- **Editar saída individual** (data/hora/capacity/preço/status) com checkbox "Notificar N clientes por e-mail"
- **Deletar saída** com confirm especial (digitar `DELETAR`) se houver bookings
- **CRUD templates** (`schedule_templates`) inline em `/admin/config`
- **Criar saída avulsa** (modal em `/admin/manifesto`) — pra feriados/eventos
- **E-mail template `schedule-changed.ts`** notifica clientes em mudança de data/hora

---

## 🗄️ Migrations recentes (Tier 3 + features)

| # | Nome | O que faz |
|---|---|---|
| 014 | `confirm_booking_payment_v2` predicate fix | Reproduz `WHERE pagarme_charge_id IS NOT NULL` no ON CONFLICT (bug crítico encontrado no go-live) |
| 015 | Soft-hold + pg_cron | `bookings.expires_at` + cron 1min expira pending_payment |
| 015b | Confirmation email | `bookings.confirmation_email_sent_at` + RPC v2 com guard idempotente |
| 016 | Admin role | Tabela `admins` + helpers + trigger seed `gomesgomes5260@gmail.com` |
| 016b | Lead invitations | `lead_invitations` (tokens pra signup pós-compra) |
| 017 | **Escuna schedule factory** | `ensure_escuna_schedules(N)` + pg_cron 06:00 UTC mantém 90 dias à frente. Capacity 120 |
| 018 | **Embarkation piers** | Tabela + seed + FK em `tour_schedules` + trigger default + RPC `admin_set_embarkation_pier` |
| 019 | **Schedule edit/delete** | RPCs `admin_update_tour_schedule` + `admin_delete_tour_schedule` (returns affected bookings) |
| 020 | **Templates CRUD + create schedule** | RPCs CRUD `schedule_templates` + `admin_create_tour_schedule` (saída avulsa) |

Arquivos SQL em `db/migrations/`.

---

## 📋 PRs recentes (depois do Tier 2)

| PR | Título | Status |
|---|---|---|
| #24 | PR-Q: captcha Turnstile + rate limit Upstash | ✅ Mergeada |
| #25 | PR-R: Sentry + PII scrubbing | ✅ Mergeada |
| #26 | design: estrutura de inspirações + research | ✅ Mergeada |
| #27 | docs: hostear research HTMLs em public/_design (depois renomeado pra public/design-docs) | ✅ Mergeada |
| #28 | design: Fase 2 sistema visual (paleta + tipografia + tokens) | ✅ Mergeada (superseded) |
| #29 | rebrand: brand guide oficial aplicado | ✅ Mergeada |
| #30 | fix: renomear `_design` → `design-docs` (Vercel bloqueia `_` prefix) | ✅ Mergeada |
| #31 | rebrand-2: Home + Header + Footer | ✅ Mergeada |
| #32 | rebrand-2b: logo PNG real + card flutuante hero | ✅ Mergeada |
| #33 | rebrand-2c: mobile spacing fix (overflow + clamp) | ✅ Mergeada |
| #34 | rebrand-2d: overhaul mobile — Container + tipografia recalibrada | ✅ Mergeada |
| #35 | rebrand-3: páginas passeio booking-style (lista) | ✅ Mergeada |
| #36 | rebrand-3b: calendar picker + horários do dia (substitui lista) | ✅ Mergeada |
| #37 | schedule-factory: sáb/dom 9:30+12:00, seg-sex 11:30, capacity 120 | ✅ Mergeada |
| #38 | rebrand-admin: sidebar dark + KPIs com ícones + dashboard | ✅ Mergeada |
| #39 | fix: regenera logo-white sem halo antialiasing | ✅ Mergeada |
| #40 | fix: admin → overview default + logo sidebar maior + calendário compacto | ✅ Mergeada |
| #41 | hero: novas imagens + remove card flutuante + reposiciona texto/botões | ✅ Mergeada |
| #42 | duration: escuna agora dura 2h30 (era 6h) | ✅ Mergeada |
| #43 | embarkation piers: admin gerencia + cliente vê taxa | ✅ Mergeada |
| #44 | schedule edit/delete: editar saída + notificar clientes | 🟡 Aberta (conflito resolvido, pronta) |
| #45 | templates CRUD + criar saída manual | ✅ Mergeada |

---

## 🎨 Brand guide oficial (em uso)

Fonte: `design/brand-guide/` (PNGs enviados pelo cliente).

### Paleta
- **Charcoal** (primary): `#404040` ★ — escala 50-900
- **Red** (accent/CTA): `#C00010` ★ — escala 50-900
- **Sea** (overlays fotográficos only): 300/500/700 — não usar em UI sólida
- **Stone-like warm grays** pra neutros

### Tipografia
- **Display** Fraunces (serif variável, opsz 9-144)
- **Body** Montserrat (heavy 900 pro wordmark NAUTI+TOUR)
- **Mono** JetBrains Mono (booking codes)

### Gradientes
`--gradient-flag` (red) · `--gradient-iron` (charcoal) · `--gradient-mare` (sea)

### Logo
3 variantes em `public/brand/` extraídas via `scripts/extract-logo-variants.mjs` (chroma key por luminância):
- `logo-charcoal.png` — fundo claro
- `logo-white.png` — fundo escuro
- `logo-knockout.png` — preto puro

Componente `<Logo>` em `src/components/Logo.tsx` usa via `next/image`.

Docs visuais renderizadas:
- https://nautitour-website.vercel.app/design-docs/00-status.html
- https://nautitour-website.vercel.app/design-docs/01-fase1-personas.html
- https://nautitour-website.vercel.app/design-docs/03-brand-guide-applied.html

---

## 🚧 O que falta (próximos passos sugeridos)

1. **PR-S** (CSP report-only + Origin check signout + HSTS preload) — fecha pentest items D6/D11/D12
2. **PR-T** (Refund parcial UI) — backend já aceita `amountCents` opcional
3. **PR-U** (Paginação `/admin/clientes`)
4. **Rebrand páginas internas remanescentes** — `/checkout`, `/reserva`, `/login`, `/signup`, `/admin/reservas`, etc — herdam layout mas conteúdo precisa migrar de classes legacy pra tokens novos
5. **PR-Final** (swap domínio apex + Resend verificado) — aguarda DNS mpjunior

---

## 🚀 Go-live (11/05, tarde)

**Site vendendo:** https://nautitour-website.vercel.app — modo `live`. Qualquer pessoa que reservar escuna (R$ 60/pax) ou lancha privativa (R$ 1.200) consegue pagar.

**Validações end-to-end realizadas no `tour-de-teste`:**
- ✅ **PIX (R$ 1,00) — booking `NTT-AKH87K`**: criado 14:42:05 BRT, pago 14:42:44 (39s), `confirm_booking_payment` rodou com IDs reais (`ch_xELNdockzsE0beq5` / `or_PbdAzZCMPh6yAp5k`)
- ✅ **Cartão (R$ 1,00) — falha autorizada — booking `NTT-G9QEAS`**: 2 tentativas com cartões diferentes, ambas retornaram `failed` do emissor; `mark_booking_payment_failed` registrou as duas com `charge_id` diferentes — comprova que o fix de idempotency-key com hash do token está funcionando. Caminho de aprovação reusa a mesma RPC do PIX (já validada).

**Bug crítico encontrado durante validação (migration 014):**
- `confirm_booking_payment` / `mark_booking_payment_failed` tinham `ON CONFLICT (pagarme_charge_id)` mas o índice é parcial (`WHERE pagarme_charge_id IS NOT NULL`). PostgreSQL exigia o predicado reproduzido no `ON CONFLICT` — sem isso o webhook devolvia 500 e Pagar.me retentava 3x sem sucesso. Reproduzimos o predicado nas duas funções. Bug latente desde migration 012 — só apareceu na primeira transação real.

**Pendência de baixa prioridade — reconciliar `NTT-56D5QN`:**
- R$ 1 pago no Pagar.me hoje de manhã (antes da migration 014) — booking ficou em `pending_payment` no nosso banco por causa do bug acima. Pra reconciliar: pegar o `charge_id` (`ch_*`) + `order_id` (`or_*`) desse pagamento no painel Pagar.me e inserir manualmente em `payments`. Sem urgência — não afeta operação.

**Env vars Pagar.me em produção (estado final):**
- `PAGARME_MODE=live`
- `PAGARME_API_KEY` ✅
- `PAGARME_WEBHOOK_USER` / `PAGARME_WEBHOOK_PASSWORD` ✅
- `NEXT_PUBLIC_PAGARME_PUBLIC_KEY` ✅
- `PAGARME_ALLOWED_EMAILS` — setado mas ignorado em modo `live`. Manter pra reverter pra `allowlist` se precisar.
- `BOOKING_SESSION_SECRET` — não setado; fallback para `SUPABASE_SERVICE_ROLE_KEY`. Setar dedicada quando quiser rotação independente.

---

## 🛠️ Tier 0 — soft-hold + Resend + admin (11/05, noite)

3 PRs mergeadas em sequência fechando os piores riscos operacionais imediatos:

**PR #7 — Soft-hold de assentos (migration 015)**
- `bookings.expires_at` + cron `pg_cron` a cada 1min cancela bookings `pending_payment` expirados e devolve a vaga.
- `create_booking_pending` consome `seats_taken` no insert (tour `scheduled`) com TTL de 10min. Tour `private` (lancha) continua imediato (sold_out na criação).
- Pages `/reserva/[code]` e `/reserva/[code]/pagamento` revalidam `expires_at` antes de chamar Pagar.me + countdown UI client-side com auto-refresh.
- PIX `expiresInSeconds` alinhado pra 600s (mesmo TTL do hold).
- **Fecha D9 do pentest** (oversell silencioso por concorrência).

**PR #8 — Resend + e-mail de confirmação (migration 015b)**
- `bookings.confirmation_email_sent_at` + RPC `confirm_booking_payment_v2` returns `boolean`. UPDATE atomico com guarda em `IS NULL` garante idempotência: retry do webhook não dispara segundo e-mail.
- `src/lib/email.ts` (Resend client), `src/lib/email-templates/booking-confirmation.ts` (HTML inline com cores #096EAB/#D90006, escape XSS), `src/lib/email-flow.ts` (join + envio).
- Plugado em `api/webhooks/pagarme/route.ts` (PIX + retries de cartão) e em `actions.ts` (cartão aprovado em primeira chamada — PIX só vira `paid` via webhook).
- Sem `RESEND_API_KEY`: warn + skip (degradação suave). Booking ainda confirma.

**PR #9 — Painel admin (migration 016 + 016b)**
- Tabela `public.admins (user_id, role)` com RLS (self_read + owner-all) e helper RPC `is_admin(uuid)`. Trigger em `auth.users` auto-promove `gomesgomes5260@gmail.com` a `owner` na primeira vez que ele criar conta.
- `/admin/layout.tsx` — gate de auth + nav local. Sem user → `/login?redirect=...`. Sem admin → `/`.
- `/admin/reservas` — tabela com filtros (de, até, status), até 500 linhas. Botão **Exportar CSV** gera CSV com BOM UTF-8 (até 5000 linhas). Server action re-valida auth + admin.
- `/admin/manifesto?date=YYYY-MM-DD` — lista saídas do dia em BRT com ocupação. `/admin/manifesto/[scheduleId]` é print-friendly e lista todos `booking_passengers` das bookings `confirmed`.
- `Header.tsx` mostra link **Admin** (vermelho, bold) quando `isAdmin=true`.

**Env vars novas (Vercel, prod):**
- ✅ `RESEND_API_KEY` (sensitive)
- ✅ `RESEND_SENDER` = `Nautitour <onboarding@resend.dev>`
- ✅ `NEXT_PUBLIC_SITE_URL` = `https://nautitour-website.vercel.app`

**Caveats:**
- Sender `onboarding@resend.dev` só entrega pra e-mails registrados na conta Resend. Pra produção real (cliente qualquer recebe), precisa de domínio próprio verificado (Tier 2).
- Admin owner inicial: cadastrar `gomesgomes5260@gmail.com` em `/signup` — o trigger promove automaticamente.

---

## 🚀 Tier 2 — escala, receita, UX e retenção (12/05)

6 PRs mergeadas (J, K, M, N, O, P). 2 itens (I + L) ficam pra **PR-Final** quando o swap apex do `nautitour.com.br` for feito (DNS hoje gerenciado por mpjunior; precisa adicionar records do Resend lá pro lead recapture funcionar de verdade).

**PR #17 — Parcelamento de cartão (sem migration)**
- Lancha (tour_type='private'): até 6x sem juros, mínimo R$ 100/parcela
- Escuna (tour_type='scheduled'): 1x à vista
- `CardCheckout.tsx` ganha `<select>` "Nx de R$ Y,YY sem juros"
- `pagamento/actions.ts` faz re-check server-side de `tour_type` (defense in depth contra burla do select)

**PR #18 — Conversão inquiry→booking 1-click (migration 021)**
- `bookings.payment_link_token text` + unique index parcial
- RPC `admin_convert_inquiry_to_booking(inquiry_id, price_cents, departure_at)` cria schedule dedicado private/sold_out + booking pending_payment com TTL 24h + token urlsafe
- Rota pública `/pagar/[token]`: valida token, setta cookie HMAC, redireciona pra pagamento
- `/admin/inquiries/[id]` ganha botão "Converter em reserva" (modal preço + datetime) e card verde com link de pagamento depois de converter

**PR #19 — Dashboard "Visão geral" (sem migration)**
- Nova rota `/admin/overview`, `/admin` redireciona pra ela, "Visão geral" vira primeira aba do nav
- 4 KPIs (Receita do mês, Embarques hoje, Ocupação 7d, Reembolsos)
- Card "Saídas de hoje" + bar chart SVG inline "Receita 14 dias" + feed "Atividade recente" (10 últimos `booking_events` com whitelist)
- Tour-de-teste excluído de tudo

**PR #20 — Financeiro (sem migration)**
- Nova rota `/admin/financeiro` com filtro mensal `?month=YYYY-MM` + nav prev/hoje/next
- 4 KPIs (Receita do mês, A receber, Reembolsos, Cancelados)
- Card "Receita por método" (PIX/cartão/boleto) com barras horizontais coloridas
- Card "Receita por produto" stacked bar 100% colorida por tour
- Tabela top-20 transações com link pra reserva admin

**PR #21 — Cancelamento pelo cliente até 48h antes (migration 022)**
- RPC `customer_cancel_booking(p_booking_id, p_reason)` SECURITY DEFINER com 4 checagens: auth.uid, ownership via customer.auth_user_id, status confirmed/pending_payment, departure_at > now+48h
- Cliente autenticado vê botão "Cancelar reserva" em `/reserva/[code]` e link inline em `/minhas-reservas`. Mensagem clara se <48h orienta WhatsApp
- Refund continua manual (admin processa pelo botão da PR #13). Modal avisa "em até 5 dias úteis"
- Guest sem login: botão não aparece (resolve quando PR-L for ao ar)

**PR #22 — Clientes CRM-light (sem migration)**
- Nova rota `/admin/clientes` lista top 50 com busca (nome/e-mail) + sort (gasto/recência/count)
- 4 KPIs globais (Clientes ativos, Recorrentes, Ticket médio, Guests %)
- Tags automáticas: VIP (≥R$3000), Recorrente (>1 booking), Lancha (já reservou private), Guest (no drawer)
- Avatar com hash determinístico (8 cores, sem libs)
- `/admin/clientes/[id]`: drawer com dados pessoais, 3 KPIs, histórico completo de bookings com link admin

---

## 🛠️ Tier 1 — admin push completo (11/05, fim do dia)

5 PRs mergeadas (D→E→F→G→H) cobrindo todo o operacional do painel:

**PR #11 — Schedule generator + bloquear saídas (migration 017 + 017b)**
- `schedule_templates` (regras de geração por tour+weekday+hora) + 28 templates seedados do estado atual (escuna + lancha + tour-de-teste)
- RPC `generate_future_schedules(p_days_ahead)` SECURITY DEFINER que mantém saídas adiante. ON CONFLICT → idempotente
- `pg_cron` job diário às 04:00 BRT garante 28 dias sempre cobertos. 017b incluiu `tour_type='private'` (lancha) que estava fora
- RPC `block_schedule(p_schedule_id, p_reason)` cancela saída + bookings ativas (trigger devolve vagas) + loga `schedule_blocked` em `booking_events`
- `booking_events` tabela mínima introduzida aqui (PR-F estende)
- Unique constraint `(tour_id, departure_at)` em `tour_schedules`
- UI `/admin/config` com Card "Saídas — geração automática" + botão Regenerar agora; UI no manifesto individual com botão "Bloquear saída"

**PR #12 — Inquiries admin (migration 018)**
- `inquiry_requests.admin_notes` + `status_changed_at` + `status_changed_by`
- RPC `admin_update_inquiry` auto-popula `whatsapp_contacted_at` na primeira transição pra `contacted`
- `/admin/inquiries` lista com chips de filtro por status (Todos/Novos/Contactados/Ganhos/Perdidos com contagem)
- `/admin/inquiries/[id]` drawer-like: detalhes do pedido + cliente (link WhatsApp formatado) + histórico + 4 botões de status + notas internas
- `/locacao-escuna/actions.ts` agora captura `inquiry_id` e marca `whatsapp_contacted_at` antes de redirecionar pro WhatsApp
- `lost` reusado como "arquivado" (sem novo enum)

**PR #13 — Drawer reserva + cancelar + reembolso híbrido (migration 019)**
- RPC `admin_cancel_booking` SECURITY DEFINER — marca cancelled + trigger devolve vaga + loga `admin_cancelled` em events
- RPC `admin_mark_refund_attempt` registra refund_succeeded/refund_failed e atualiza `payments.status` + `bookings.status` quando ok=true
- `pagarme/client.ts` ganha `refundCharge(chargeId, amountCents?)` chamando DELETE /v5/charges/{id}
- Backfill retroativo de `booking_events` (`created`, `payment_paid`, `payment_failed`) pros 4 bookings existentes
- `/admin/reservas/[code]` drawer admin: 4 cards (detalhes + cliente + passageiros + pagamentos) + sidebar com Histórico + 3 botões (Reenviar e-mail, Cancelar com motivo, Tentar reembolso automático)
- Link da lista trocado: vai pra `/admin/reservas/[code]` em vez da página pública

**PR #14 — Heatmap mensal (sem migration)**
- Substitui `/admin/manifesto/page.tsx`: grid calendário 7 × N de células coloridas por ocupação (`<30%` emerald-100, `30-69%` emerald-500, `70-94%` amber-500, `≥95%` red-600, cancelled cinza+line-through)
- Cada célula é Link pra `/admin/manifesto/[scheduleId]` (manifesto print-friendly intocado)
- Navegação `?month=YYYY-MM` com botões Mês anterior / Hoje / Próximo
- KPIs no topo: saídas no mês, capacidade total, % reservado. Hoje destacado. Sem libs UI (só Tailwind+CSS Grid)

**PR #15 — Admin mgmt + editar preços/capacidades (migration 020)**
- View `admins_with_email` (security_invoker) — junção `admins ⨝ auth.users` pra UI listar com e-mail
- RPC `admin_add_admin_by_email(email, role)` owner-only — exige que a pessoa tenha feito signup
- RPC `admin_remove_admin(user_id)` owner-only com 3 guardrails: não-self, não-último-owner, target deve existir
- RPC `admin_update_tour_pricing(tour_id, base_price_cents?, max_capacity?, apply_to_future_schedules?)` admin-callable. Apply-to-future propaga pros `tour_schedules` futuros + sincroniza `schedule_templates`
- `src/lib/admin.ts` ganha `isOwnerUser` helper
- `/admin/config` ganha 2 cards: Preços e capacidade (1 form por tour com checkbox apply-to-future) + Administradores (tabela + form add owner-only + botão remover)

---

## 1. Páginas / rotas

### Públicas
| Rota | Status | Notas |
|---|---|---|
| `/` (home) | ✅ | Estática; pode evoluir pra puxar tours dinamicamente |
| `/passeio-escuna` | ✅ | Listagem dinâmica + Reservar |
| `/passeio-lancha` | ✅ | 09:30 e 14:00 BRT + caixa WhatsApp |
| `/locacao-escuna` | ✅ | Form de inquiry → salva lead + abre WhatsApp |
| `/sobre-nos` | 🟡 | Estrutura pronta, conteúdo placeholder (TODO) |
| `/contato` | ✅ | Telefones, e-mail, endereço |
| `/faq` | 🟡 | 6 perguntas iniciais — revisar com equipe |
| `/politica-de-privacidade` | 🟡 | Texto preliminar — **revisar com jurídico** |
| `/politica-de-cancelamento` | 🟡 | 48h/24h placeholder — **confirmar regras** |

### Reserva / pagamento
| Rota | Status | Notas |
|---|---|---|
| `/checkout/[scheduleId]` | ✅ | Form completo; `pricingMode` per_passenger / per_slot |
| `/reserva/[code]` | ✅ | Confirmação + status; botão de pagamento desabilitado |

### Auth
| Rota | Status |
|---|---|
| `/login`, `/signup` | ✅ |
| `/esqueci-senha`, `/redefinir-senha` | ✅ |
| `/auth/callback`, `/api/auth/signout` | ✅ |

### Área do cliente
| Rota | Status | Notas |
|---|---|---|
| `/minhas-reservas` | ✅ | Auth-gated; lista ordenada por data com booking_code |
| `/minha-conta` | ✅ | Edita nome/telefone/CPF + altera senha (re-auth obrigatório) |

### Boundaries
| Rota | Status |
|---|---|
| `not-found.tsx` (404) | ✅ |
| `error.tsx` (boundary global) | ✅ |

### Admin
| Rota | Status | Notas |
|---|---|---|
| `/admin` | ✅ | Redirect → `/admin/overview` |
| `/admin/overview` | ✅ | KPIs do mês + saídas de hoje + receita 14d + atividade recente |
| `/admin/reservas` | ✅ | Tabela com filtros + export CSV |
| `/admin/reservas/[code]` | ✅ | Drawer detalhes + Reenviar e-mail / Cancelar / Tentar reembolso |
| `/admin/inquiries` | ✅ | Lista com chips de filtro por status |
| `/admin/inquiries/[id]` | ✅ | Drawer + workflow + notas internas + **converter em reserva** |
| `/admin/clientes` | ✅ | Top 50 + KPIs + busca + sort + tags |
| `/admin/clientes/[id]` | ✅ | Drawer com dados + histórico completo de bookings |
| `/admin/financeiro` | ✅ | KPIs mensais + receita por método/produto + transações |
| `/admin/manifesto` | ✅ | Heatmap mensal de ocupação |
| `/admin/manifesto/[scheduleId]` | ✅ | Print-friendly + botão "Bloquear saída" |
| `/admin/config` | ✅ | Schedule generator · Templates · Preços/Capacidade · Administradores |

### Cliente / público
| Rota | Status | Notas |
|---|---|---|
| `/pagar/[token]` | ✅ | Token público gerado em conversão inquiry→booking; setta cookie e redireciona pra pagamento |

### Faltando
- 🔴 `/termos-de-uso` (legal)
- 🔴 Admin Tier 1 (inquiries, calendário, cancel/refund — ver seção 5)

---

## 2. Fluxos críticos

| Fluxo | Status | Notas |
|---|---|---|
| Cadastro com email + senha | ✅ | Trigger `on_auth_user_created` linka customer |
| Login + sessão persistente | ✅ | Middleware refresca cookies |
| Esqueci/redefinir senha | ✅ | Reset link → `/auth/callback` → `/redefinir-senha` |
| Guest checkout (sem login) | ✅ | `customers.is_guest=true` |
| Reserva escuna (per_passenger) | ✅ | RPC `create_booking_pending` |
| Reserva lancha (per_slot, exclusiva) | ✅ | Marca sold_out na hora |
| Inquiry locação privativa | ✅ | RPC `create_inquiry_request` + WhatsApp |
| Pagamento PIX | ✅ | Modo `live`; E2E validado em `NTT-AKH87K` com IDs reais do Pagar.me |
| Pagamento cartão | ✅ | Modo `live`; caminho de falha validado em `NTT-G9QEAS` (2 tentativas), caminho de aprovação reusa a mesma RPC do PIX |
| Webhook Pagar.me → confirmar | ✅ | `/api/webhooks/pagarme` valida HTTP Basic Auth + amount, chama RPC idempotente; corrigido bug do `ON CONFLICT` na migration 014 |
| E-mail de confirmação da reserva | ✅ | PR #8 — Resend + RPC v2 idempotente. Caveat: sender padrão `onboarding@resend.dev` só entrega pra e-mails da conta Resend |
| E-mail "complete cadastro" (lead recapture) | 🔴 | Tabela `lead_invitations` pronta, falta envio |
| Soft hold de assentos | ✅ | PR #7 — migration 015, TTL 10min, cron pg_cron a cada 1min. Fecha D9 |
| Cancelamento pelo admin | ✅ | PR #13 (Tier 1.F) — `/admin/reservas/[code]` modal motivo. Refund híbrido: admin tenta automático ou marca pra refund manual |
| Cancelamento pelo cliente (UI) | ✅ | PR #21 — auth user dono cancela até 48h antes via `/reserva/[code]` ou `/minhas-reservas` |
| Reembolso automático pelo admin | ✅ | PR #13 — `refundCharge` em Pagar.me v5 (`DELETE /charges/{id}`); fluxo híbrido |
| Parcelamento de cartão | ✅ | PR #17 — lancha 6x sem juros (Nautitour absorve); escuna 1x; min R$ 100/parcela |
| Conversão inquiry→booking 1-click | ✅ | PR #18 — RPC admin + link público `/pagar/[token]` mandado pro cliente via WhatsApp |

---

## 3. Banco / backend

### Estrutura
| Item | Status |
|---|---|
| 12 tabelas + 6 enums | ✅ (Tier 0/1: `admins`, `booking_events`, `schedule_templates`) |
| Colunas adicionadas Tier 2: `bookings.payment_link_token` (PR #18) | ✅ |
| 1 view (`admins_with_email`, security_invoker) | ✅ |
| RLS em todas as tabelas | ✅ |
| Triggers (`on_auth_user_created`, `on_auth_user_created_admin_seed`, `tg_booking_update_seats`, `set_updated_at`) | ✅ |
| pg_cron jobs (`expire_pending_bookings_every_minute`, `generate_future_schedules_daily`) | ✅ |
| Tipos TypeScript gerados | ✅ |

### RPCs (funções públicas)
| Função | Acesso | Uso |
|---|---|---|
| `create_booking_pending` | anon, authenticated | Cria reserva pendente; consome vaga no insert (scheduled) com TTL 10min |
| `get_booking_by_code` | service_role | Lê reserva por código (PR #4 revogou anon/authenticated) |
| `create_inquiry_request` | anon, authenticated | Salva lead da locação privativa |
| `confirm_booking_payment_v2` | service_role | Confirma pagamento; retorna `boolean` indicando "primeira transição" pra idempotência de e-mail |
| `expire_pending_bookings` | service_role (cron) | Cancela bookings `pending_payment` com `expires_at < now()` |
| `is_admin` | authenticated, service_role | Checa se user é admin |
| `generate_future_schedules` | service_role (cron + UI) | Mantém 28 dias de saídas adiante baseado em `schedule_templates` |
| `block_schedule` | authenticated (admin) | Cancela saída + bookings ativas, devolve vagas, registra motivo |
| `admin_update_inquiry` | authenticated (admin) | Atualiza status/notas de inquiry; auto-popula `whatsapp_contacted_at` |
| `admin_cancel_booking` | authenticated (admin) | Cancela booking + registra motivo em `booking_events` |
| `admin_mark_refund_attempt` | authenticated (admin) | Loga sucesso/falha de refund Pagar.me; sucesso marca status refunded |
| `admin_add_admin_by_email` | authenticated (owner) | Adiciona admin com role owner/operator |
| `admin_remove_admin` | authenticated (owner) | Remove admin (não-self, não-último-owner) |
| `admin_update_tour_pricing` | authenticated (admin) | Edita `base_price_cents`/`max_capacity` + opcionalmente propaga pros schedules futuros |
| `admin_convert_inquiry_to_booking` | authenticated (admin) | Cria schedule dedicado + booking pending_payment com token público de pagamento (Tier 2.K) |
| `customer_cancel_booking` | authenticated (dono) | Cancela própria reserva até 48h antes da saída (Tier 2.O) |

### Migrations aplicadas
1. `001_initial_schema` — tabelas, enums, índices
2. `002_rls_policies` — RLS de leitura
3. `003_seed_tours` — 3 produtos do catálogo
4. `004_advisor_fixes` — search_path nas funções, deny em lead_invitations
5. `005_booking_rpcs` — RPCs `create_booking_pending` e `get_booking_by_code`
6. `006_auth_signup_trigger_and_rpc_auth` — trigger + suporte a auth.uid()
7. `007_revoke_trigger_function_execute` — bloqueia chamada direta de funções de trigger
8. `008_private_tour_pricing_and_lancha_schedules` — pricing per_slot + 28 slots de lancha
9. `009_lancha_real_schedules` — horários 09:30 e 14:00 BRT
10. `010_inquiry_extras_and_rpc` — start/end_time + open_bar + RPC inquiry
11. `011_pentest_column_grants` — restringe colunas updateáveis em customers e revoga writes diretos das demais tabelas
12. `012_pagarme_test_tour_and_payment_rpc` — `tours.is_test_only`, tour `tour-de-teste` (R$ 1,00, oculto do público), RPCs `confirm_booking_payment` / `mark_booking_payment_failed` (acessíveis só via service_role)
13. `013_pentest_round2_amount_pii_refund` — amount validation no `confirm_booking_payment`, refund cancela booking, `get_booking_by_code` REVOKE de anon/authenticated, length caps no `create_booking_pending`
14. `014_fix_payment_rpc_on_conflict_partial_index` — `ON CONFLICT (pagarme_charge_id) WHERE (pagarme_charge_id IS NOT NULL)` pra casar com o índice parcial. Bug latente das RPCs de pagamento descoberto no 1º teste E2E PIX real: o handler retornava 500, Pagar.me tentava 3x, booking ficava `pending_payment`. Fix isolado no banco — sem mudança de código
15. `015_soft_hold_pending_bookings` — `bookings.expires_at` + reescrita do `create_booking_pending` (consome vaga no insert pra scheduled, TTL 10min) + trigger ajustado pra só devolver vaga em transições terminais + RPC `expire_pending_bookings` + `pg_cron` job a cada 1min. Fecha D9 do pentest
16. `015b_confirmation_email_sent_at` — coluna `confirmation_email_sent_at` + RPC `confirm_booking_payment_v2` retorna `boolean` (true só na primeira transição, via UPDATE atomico). v1 vira wrapper void
17. `016_admin_role` — tabela `admins`, RLS, RPC `is_admin`, seed do owner. RLS: self_read pra authenticated + ALL pra owners
18. `016b_admin_auto_promote_seed` — trigger em `auth.users` auto-promove `gomesgomes5260@gmail.com` a `owner` no signup (lista hardcoded; pra Tier 1 viramos uma tabela `admin_seed`)
19. `017_schedule_templates_and_generator` — tabela `schedule_templates` + seed inicial + RPC `generate_future_schedules` + RPC `block_schedule` + tabela `booking_events` (mínima) + UNIQUE `(tour_id, departure_at)` + pg_cron diário 04:00 BRT
20. `017b_include_private_tours_in_generator` — corrige filtro pra incluir `tour_type='private'` (lancha) que ficara de fora; popula 28 dias de lancha
21. `018_inquiry_admin_lifecycle` — `inquiry_requests` ganha `admin_notes`, `status_changed_at`, `status_changed_by`; RPC `admin_update_inquiry` com auto-set de `whatsapp_contacted_at` na transição pra `contacted`
22. `019_admin_cancel_refund_and_events_backfill` — RPC `admin_cancel_booking` + RPC `admin_mark_refund_attempt`; backfill retroativo de `booking_events` (`created`, `payment_paid`, `payment_failed`) pros bookings existentes
23. `020_admin_management_and_pricing` — view `admins_with_email` (security_invoker) + RPC `admin_add_admin_by_email` (owner-only) + RPC `admin_remove_admin` (owner-only, guardrails) + RPC `admin_update_tour_pricing` com opção apply-to-future-schedules
24. `021_admin_convert_inquiry_to_booking` — `bookings.payment_link_token text` + unique index parcial + RPC `admin_convert_inquiry_to_booking` (cria schedule dedicado private/sold_out + booking pending_payment com TTL 24h + token urlsafe gerado via `pgcrypto.gen_random_bytes`)
25. `022_customer_cancel_booking` — RPC `customer_cancel_booking` SECURITY DEFINER com checagens de auth/ownership/status/janela 48h. Logging em `booking_events` com `had_paid_payment` no payload

---

## 4. Catálogo / conteúdo

| Item | Status | Notas |
|---|---|---|
| Tours seedados (escuna, lancha, locação) | ✅ |  |
| Schedules escuna (14 dias × 1 saída) | ✅ |  |
| Schedules lancha (14 dias × 2 saídas: 09:30, 14:00) | ✅ |  |
| `tours.cover_image_url` | 🟡 | Fallback no código; popular na DB |
| `tours.gallery` | 🟡 | Coluna existe, sem UI usando |
| Schedules além de 14 dias | 🔴 | Sem cron / painel para estender |

---

## 5. Admin (painel interno)

Tier 0 ✅ (PR #9) + Tier 1 ✅ (PRs #11-#15) + Tier 2 ✅ (PRs #17-#22). Referência completa em `admin-dashboard.md`.

- ✅ Dashboard "Visão geral" (KPIs do mês + saídas de hoje + bar chart 14d + atividade recente)
- ✅ Lista de reservas (filtros por data + status, export CSV até 5000 linhas)
- ✅ Drawer detalhe de reserva (passageiros + pagamentos + timeline) com botões Reenviar e-mail / Cancelar / Tentar reembolso automático
- ✅ Lista de inquiries de locação privativa (filtros, drawer com workflow new→contacted→won/lost + notas internas + **conversão em booking 1-click com link de pagamento público**)
- ✅ Manifesto de embarque (print-friendly, lista `booking_passengers` confirmados)
- ✅ Calendário/heatmap mensal de saídas com ocupação colorida
- ✅ Clientes (lista top 50 + busca + sort + tags VIP/Recorrente/Lancha/Guest + drawer histórico)
- ✅ Financeiro (4 KPIs + receita por método + receita por produto + tabela transações por mês)
- ✅ Cancelar / reembolsar pelo painel (refund híbrido — automático ou manual)
- ✅ Bloquear saídas (feriados, manutenção) com motivo + cancelamento automático das reservas
- ✅ Gerenciar admins (adicionar por e-mail / remover, owner-only)
- ✅ Editar preços e capacidades dos tours (com opção apply-to-future-schedules)
- ✅ Login admin (roles `owner`/`operator`)
- 🔴 Calendário/heatmap modo semanal (toggle) — Tier 3
- 🔴 Templates de horário editáveis pela UI (criar/desativar) — Tier 3
- 🔴 Roles além de owner/operator (comandante, financeiro) — Tier 3
- 🔴 Paginação na lista de clientes (top 50 atual) — Tier 3 quando virar gargalo

---

## 6. Pentest — relatório

### Auditoria realizada
- ✅ OWASP Top 10 review
- ✅ `npm audit`
- ✅ Inspeção de server actions e RPCs
- ✅ RLS / column-level grants
- ✅ Open redirect search
- ✅ Hardcoded secrets check

### Auditoria realizada — 2º pentest (madrugada 11/05)
- ✅ 3 agentes em paralelo (webhook+Basic Auth, fluxo de pagamento, regressão+nova superfície)
- ✅ Supabase advisor — security
- ✅ Re-verificação de F1–F5

### Achados corrigidos — 1ª rodada (F1–F5)

| ID | Categoria | Descrição | Correção |
|---|---|---|---|
| F1 | A01 Access Control | Open redirect em `/login?redirect=…` (`redirect(input.redirectTo \|\| '/')`) aceitava URL externa | `safeRedirectPath()` em `src/lib/safe-redirect.ts` — só aceita paths internos absolutos |
| F2 | A01 Access Control | Open redirect em `/auth/callback?next=…` | Mesma helper |
| F3 | A01 Access Control | Cliente autenticado podia UPDATE `customers.email`, `auth_user_id`, `is_guest` via REST (RLS permitia row, não restringia colunas) | Migration `011`: `revoke update on customers from authenticated; grant update (full_name, phone, cpf)` |
| F4 | A01 Access Control | Cliente podia escrever direto em `bookings`, `payments`, `tour_schedules`, `tours`, `inquiry_requests`, `lead_invitations` (escrita só deveria vir via RPCs) | Migration `011`: `revoke insert/update/delete` nessas tabelas para `anon` e `authenticated` |
| F5 | A05 Misconfig | Sem security headers HTTP | `next.config.ts` agora envia `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` |

### Achados corrigidos — 2ª rodada (G1–G9, PR #4)

| ID | Severidade | Descrição | Correção |
|---|---|---|---|
| G1 | **Alta** A04 | Webhook não comparava `event.data.amount` com `bookings.total_cents`. Atacante com credenciais do webhook podia pagar R$1 e confirmar reserva de R$1000 | Migration `013`: `confirm_booking_payment` aborta se amount ≠ total_cents. Handler também valida antes (mensagem de erro mais específica) |
| G2 | **Alta** A01 | `get_booking_by_code` (SECURITY DEFINER, callable por anon) retornava `customer_email` + `customer_full_name`. Combinado com booking_code de 6 chars = base de clientes enumerável via REST | Migration `013`: REVOKE EXECUTE de anon/authenticated; pages migradas pra `createAdminClient()` (server-only) |
| G3 | **Alta** A01 | `createPixForBookingAction` / `createCardForBookingAction` aceitavam `bookingCode` arbitrário sem provar posse → IDOR. Quem enumerasse um código alheio gerava order Pagar.me em nome da vítima | `src/lib/booking-session.ts`: HMAC do `booking_code` salvo em cookie HttpOnly no `createBookingAction`. Actions de pagamento exigem cookie OU `auth.uid()` casando com `customer.auth_user_id` |
| G4 | Média A04 | `mark_booking_payment_failed` só mexia em `payments`, não em `bookings`. Chargeback fraudulento mantinha reserva `confirmed` — embarque grátis | Migration `013`: em `p_status='refunded'`, marca `bookings.status='cancelled'` |
| G5 | Média A04 | `idempotencyKey = booking-<id>-card` cacheava a resposta da 1ª tentativa. Cliente errou CVV → ficava preso na falha em cache, sem poder tentar outro cartão | `client.ts`: idempotency-key vira `booking-<id>-card-<hash12(cardToken)>`. Cada cartão novo abre slot novo |
| G6 | Baixa A05 | `NEXT_PUBLIC_PAGARME_PUBLIC_KEY` era usada sem validar prefixo. Se alguém colasse `sk_…` por engano, o secret iria pro bundle | `tokenize.ts`: throw se não começa com `pk_` |
| G7 | Baixa A05 | Middleware Supabase rodava em todas as rotas, incluindo `/api/webhooks/*` — overhead + chamada desnecessária a `auth.getUser()` em cada webhook | `middleware.ts`: matcher exclui `api/` |
| G8 | Baixa A04 | Webhook aceitava `charge.id = ''` → várias linhas com PK vazio em `payments` | Handler e RPCs rejeitam charge id vazio |
| G9 | Baixa A04 | `create_booking_pending` aceitava `p_notes`, `p_email`, etc. de tamanho ilimitado via PostgREST | Migration `013`: caps em e-mail (254), nome (200), notes (1000), passengers (200) |

### Achados aceitos / a tratar depois

| ID | Severidade | Descrição | Mitigação prevista |
|---|---|---|---|
| D1 | Baixa | `npm audit`: postcss <8.5.10 (XSS no CSS Stringify) — vulnerabilidade transitiva via `next` | Aguardar release do Next que bumpe o postcss; fix forçado downgrade quebra a build |
| D2 | Média | RPC `create_booking_pending` (anon) pode ser chamado em loop pra esgotar capacidade de schedules | Captcha + rate limit no caminho HTTP; soft-hold com expiração |
| D3 | Média | RPC `create_inquiry_request` (anon) pode ser spammado | Captcha + rate limit |
| D4 | Baixa | `booking_code` tem 6 chars de alfabeto 32 (~10⁹) — enumerável em massa | Mitigado parcialmente em PR #4 (PII removida de `get_booking_by_code`, e-mail mascarado em `/reserva/[code]`, ownership cookie nas actions). Restante: rate limit no nível de página |
| D5 | Baixa | `/reserva/[code]` exibia e-mail do cliente em claro | ✅ Mitigado em PR #4: e-mail mascarado (`a***@gmail.com`) |
| D6 | Baixa | Sem CSP (Content-Security-Policy) | Definir `default-src 'self'` + nonces após estabilizar dependências |
| D7 | Baixa | Sem error tracking em produção (Sentry) | Configurar antes do go-live |
| D8 | Informativa | 4 lints "SECURITY DEFINER callable by anon/authenticated" no advisor do Supabase | **Intencional**: 2 RPCs precisam ser anon-callable (guest checkout + inquiry). PR #4 revogou `get_booking_by_code` → desceu de 6 pra 4 lints |
| D9 | ~~Média~~ ✅ | ~~**Oversell silencioso**: 2 clientes podem ter booking `pending_payment` na mesma vaga.~~ **Resolvido em PR #7 (Tier 0)**: vaga consumida no insert, TTL 10min, cron `pg_cron` cancela holds expirados a cada 1min. Caso de aresta restante: cliente paga PIX após `expires_at` (improvável agora que PIX expira em 10min) — webhook é no-op, sem refund automático. Refund automático fica como follow-up |
| D10 | Baixa | Mensagens de erro nas server actions devolvem `error.message` cru do Supabase — pode vazar nome de constraint/table e ajudar enumeração de e-mail em login/signup | Mapear erros conhecidos pra mensagens UX em PT-BR; logar o erro original server-side. PR #4 já fez isso pras actions de pagamento; falta login/signup/resetpw |
| D11 | Baixa | `/api/auth/signout` não valida header `Origin` | Adicionar check `Origin === host` como defesa em profundidade |
| D12 | Baixa | HSTS sem `preload` | Adicionar `; preload` quando migrar pro domínio próprio |

### Cobertura — OWASP Top 10
| | Avaliação |
|---|---|
| **A01** Broken Access Control | ✅ RLS + column grants + safeRedirect |
| **A02** Crypto Failures | ✅ Senhas via Supabase (bcrypt), HTTPS via Vercel, sem secrets em client bundle |
| **A03** Injection | ✅ Sem SQL string concatenation; React escapa por padrão; sem `dangerouslySetInnerHTML` |
| **A04** Insecure Design | 🟡 Sem captcha/rate limit em fluxos públicos (D2, D3) |
| **A05** Security Misconfig | ✅ Headers + sem debug em prod |
| **A06** Vulnerable Components | 🟡 1 transitiva moderada (D1) |
| **A07** Identification & Auth | ✅ Senha mín. 8 chars, e-mail confirm ON por padrão, reset com token Supabase |
| **A08** Data Integrity | ✅ CSRF: server actions + cookies SameSite |
| **A09** Logging | 🔴 Sem log/tracker estruturado (D7) |
| **A10** SSRF | ✅ Sem fetch de URL controlada por usuário |

---

## 7. SEO / técnico

| Item | Status |
|---|---|
| Metadata por página (title, description) | ✅ Páginas novas têm `metadata` |
| Open Graph / Twitter Cards | 🔴 |
| `sitemap.xml` | 🔴 |
| `robots.txt` | 🔴 |
| `favicon.ico` | 🔴 |
| Google Analytics / GA4 | 🔴 |
| Schema.org (TouristTrip) | 🔴 |
| Error tracking | 🔴 (D7) |

---

## 8. Operacional / deploy

| Item | Status |
|---|---|
| Vercel deploy | ✅ `nautitour-website.vercel.app` |
| Domínio próprio | 🔴 |
| Variáveis de ambiente em prod | 🟡 Só falta `PAGARME_ALLOWED_EMAILS` |
| Supabase em sa-east-1 (atual: us-west-2) | 🟡 Recomendar migração antes do go-live |
| Backups DB | ✅ (Supabase auto) |
| SMTP em prod (Resend ou similar) | ✅ Resend free tier (3k/mês). Sender `onboarding@resend.dev` até verificar domínio próprio (Tier 2) |

---

## 9. Mídia / assets

| Item | Status |
|---|---|
| Logos (4 variantes) | ✅ |
| Ícones spot (12 SVGs) | ✅ |
| Fotos: aerea, buzios, clientes, drinks, equipe, escuna, ilhas, misc | ✅ |
| Foto específica de **lancha privativa** | 🔴 (pasta vazia, fallback no código) |
| Imagens de certificações (cert-buzios, cert-cadastur) | 🔴 (404 atual) |
| Galeria por tour | 🔴 (coluna `gallery` vazia) |

---

## 10. Decisões abertas

1. **Idiomas** — só PT-BR, ou EN/ES também? (highlights citam tripulação bilíngue)
2. **Política de cancelamento real** — placeholder hoje (48h/24h) — confirmar
3. **Termos / privacidade** — texto preliminar; revisar com jurídico
4. **Roteamento WhatsApp** — todos os inquiries pro `(22) 99847-9728`?
5. ~~**Soft hold** — quanto tempo segurar reserva pendente?~~ ✅ **Resolvido** (PR #7): 10min pra tour scheduled; private continua imediato (sold_out na criação)
6. ~~**Lista de admins** — quem terá acesso ao painel~~ ✅ **Resolvido** (PR #9): `gomesgomes5260@gmail.com` como owner. Mais admins via SQL `INSERT INTO admins...`; UI pra gerenciar é Tier 1
7. ~~**E-mail provider** — Resend, Mailgun, SendGrid, ou SMTP próprio?~~ ✅ **Resolvido** (PR #8): Resend. Falta domínio próprio verificado pra entregar a cliente qualquer (Tier 2)
8. **Domínio** — comprou? registrar onde?
9. **Idade mínima / regras p/ crianças** — checkbox `is_child` existe sem regra
10. **Comissão de afiliados** — vi `commission_payments` no projeto antigo — vai ser necessário?
11. **Design system completo** *(entrega pendente do cliente)* — antes da fase de design, reunir e entregar todos os elementos abaixo. Itens marcados 🟡 já existem parcialmente em `docs/design-system/` ou em `public/images/`, mas precisam ser revisados/ampliados pra virar um sistema robusto. Sem isso, qualquer redesign será suposição.

    **Identidade visual**
    - 🟡 **Logo** — versões em uso (PNGs full color, mono charcoal, mono red, white). Faltam: SVGs vetoriais, símbolo isolado (sem texto), versões horizontal/vertical, favicon (`favicon.ico` + `apple-touch-icon.png`) e área de respiro mínima documentada.
    - 🔴 Brandbook curto (1–2 páginas): usos permitidos / proibidos do logo, sobre fundos claros e escuros.

    **Templates / referências de design**
    - 🔴 Links/screenshots de sites concorrentes ou de inspiração que o cliente admira (3–5 referências), com nota do que gosta em cada um (tipografia, fotografia, layout, tom).
    - 🔴 Wireframes ou mockups (Figma/imagens), mesmo que rascunho, das telas-chave: home, página de tour, checkout, confirmação.

    **Tipografia**
    - 🟡 Famílias atuais: Plus Jakarta Sans + Inter (via Google Fonts). Confirmar se ficam ou trocar.
    - 🔴 Escala tipográfica: tamanhos para H1/H2/H3/H4, body, small, caption + line-heights e pesos por nível.
    - 🔴 Web fonts próprias (se trocar Google Fonts) e regras de fallback.

    **Paleta de cores**
    - 🟡 Primárias em uso: azul `rgb(9,110,171)`, vermelho `rgb(219,56,44)`, vermelho escuro `rgb(217,0,6)`. Existe `docs/design-system/colors_and_type.css` mas o app inteiro usa inline styles — não há tokens consumidos.
    - 🔴 Paleta completa documentada: primárias + secundárias + neutros (escala de cinzas) + estados (success, warning, error, info) + background/surface.
    - 🔴 Decisão: dark mode? Se sim, paleta espelhada.
    - 🔴 Validação de contraste WCAG AA para combinações texto/fundo.

    **Iconografia**
    - 🟡 12 spot icons SVG em `public/images/icons/` (anchor, boat, cocktail, drinks, embarque, escolha, island, pague, sun, tripulacao, wheel, bilingue) + `lucide-react` para UI. Faltam: ícones para FAQ/contato/políticas, social (Facebook/Instagram/YouTube já são SVGs inline no Footer), bandeiras (se idiomas), pagamento (PIX, bandeiras de cartão), estados (check, alerta).
    - 🔴 Tamanhos padrão e estilo (outline vs filled) documentados.

    **Banco de imagens**
    - 🟡 Categorias atuais: aerea, buzios, clientes, drinks-bordo, equipe, escuna, ilhas, misc. Faltam: pasta `lancha-privativa` (vazia), certificações (`cert-buzios.png`, `cert-cadastur.png` que dão 404), covers definitivos por tour (`tours.cover_image_url`) e galeria por tour (`tours.gallery`).
    - 🔴 Diretrizes de fotografia: aspect ratios padrão (16:9, 4:3, 1:1), tratamento (filtro/saturação), uso de pessoas/rostos, releases assinados.
    - 🔴 Versões otimizadas (WebP/AVIF) ou definir que o `next/image` cuida.

    **Tokens de espaçamento e layout**
    - 🔴 Escala de spacing (ex: 4/8/12/16/24/32/48/64/96) + breakpoints responsivos definidos.
    - 🔴 Grid e largura máxima de container.

    **Bordas, raios e sombras**
    - 🔴 Border-radius scale (sm, md, lg, full).
    - 🔴 Shadow scale (elevation 1–4) e border weights.

    **Componentes UI documentados**
    - 🔴 Botões (primário, secundário, terciário, ghost) × tamanhos (sm/md/lg) × estados (default, hover, focus, disabled, loading).
    - 🔴 Inputs/textarea/select × estados (default, focus, error, disabled) + mensagens de validação.
    - 🔴 Cards, badges/chips, alerts/toasts, modais, tabs, acordeão, paginação, tooltips, skeletons de loading.
    - 🔴 Headers/footers responsivos (atual já existe, mas sem padrão formal).

    **Animação e microinterações**
    - 🔴 Durações (fast/normal/slow) e easing padrão.
    - 🔴 Padrões (fade, slide, scale) e quando usar cada um.

    **Acessibilidade**
    - 🔴 Estilo de focus ring visível em todos os interativos.
    - 🔴 Tamanho mínimo de área de toque (44×44px).
    - 🔴 Alt text padrão para fotos do banco.

    **Tom de voz / copy**
    - 🔴 Vocabulário preferido vs evitado (ex: "passeio" vs "tour"), uso de PT-BR, formal/informal.
    - 🔴 Padrões de CTA ("Reservar agora" vs "Comprar"), mensagens de erro humanas.

    **Implementação no código**
    - 🔴 Migrar inline styles → tokens (CSS variables ou Tailwind config). Hoje cada componente repete cores em `style={{ color: 'rgb(...)' }}`.
    - 🔴 Convenção de naming dos tokens (ex: `color-primary-500`, `space-4`).
12. **Banco de imagens no repositório** *(entrega pendente do cliente)* — fazer upload das fotos definitivas em alta resolução para `public/images/photos/` (substituindo placeholders quando aplicável) e também das imagens faltantes hoje: foto de **lancha privativa** (pasta vazia), **certificações** (`cert-buzios.png`, `cert-cadastur.png` referenciadas em `WhyChooseUs` que dão 404), e covers/galeria por tour (`tours.cover_image_url` e `tours.gallery`).

---

## 11. Próximos passos sugeridos

### P3 — Pagar.me (em andamento, modo `allowlist` em produção)

**Pronto:**
- ✅ `src/lib/pagarme/{config,client,webhook}.ts` — cliente HTTP, Basic Auth verifier, modo `off|allowlist|live`
- ✅ `src/lib/supabase/admin.ts` — service_role client (server-only)
- ✅ Migration `012` — tour de teste (R$ 1,00, `is_test_only`), RPCs `confirm_booking_payment` e `mark_booking_payment_failed` (idempotentes)
- ✅ `/reserva/[code]/pagamento` — seletor PIX | Cartão. PIX gera QR + copy/paste e faz polling; cartão tokeniza no browser e cobra de forma síncrona
- ✅ `src/lib/pagarme/tokenize.ts` — POST direto pro `/v5/tokens` com a `NEXT_PUBLIC_PAGARME_PUBLIC_KEY`. PAN/CVV não tocam nosso servidor
- ✅ `/api/webhooks/pagarme` — valida HTTP Basic Auth antes de tocar o banco; idempotente (PR #2)
- ✅ Webhook configurado no painel Pagar.me (URL + Basic Auth)
- ✅ Env vars do webhook em produção: `PAGARME_WEBHOOK_USER`, `PAGARME_WEBHOOK_PASSWORD`

**Pendente (próxima sessão):**
- ✅ Teste E2E PIX (R$ 1,00) — feito (NTT-AKH87K)
- ✅ Teste E2E cartão (R$ 1,00) — feito (NTT-G9QEAS, caminho de falha)
- ✅ `PAGARME_MODE=live`
- ✅ Soft hold + cron de expiração (PR #7)
- ✅ E-mails transacionais (PR #8 — Resend)
- ✅ Cancelamento + reembolso automático pelo admin (PR #13 — refund híbrido)
- ✅ Parcelamento de cartão (PR #17 — lancha 6x sem juros)
- 🔜 Lead recapture e-mail — depende da PR-Final (Resend com domínio verificado)

### P4 — Admin
- ✅ Tier 0: reservas + manifesto + CSV (PR #9)
- ✅ Tier 1 completo (PRs #11-#15): schedule generator + cron, inquiries com workflow, drawer reserva com cancel/refund híbrido, heatmap mensal, admin management UI + edição de preços/capacidades
- ✅ Tier 2 completo (PRs #17-#22): parcelamento cartão, conversão inquiry→booking, dashboard overview, financeiro, cancelamento cliente, clientes CRM
- 🔴 Tier 3: paginação clientes, templates de horário editáveis na UI, roles extras (comandante/financeiro), heatmap semanal toggle, refund parcial automatizado

### P5 — PR-Final (swap domínio + Resend verificado + lead recapture)

**O que falta pra projeto fechar:**

1. **DNS do domínio `nautitour.com.br`** hoje está com `ns1/ns2.mpjunior.com.br`. Adicionar 4 records do Resend (1 MX + 2 TXT + 1 DKIM) no painel da mpjunior pra verificar subdomínio `mail.nautitour.com.br` — não toca o site WordPress atual.
2. Configurar domínio próprio `nautitour.com.br` no Vercel + atualizar DNS apex pra apontar pra Vercel quando estiver tudo testado (fim do projeto).
3. Atualizar envs Vercel:
   - `RESEND_SENDER=Nautitour <reservas@mail.nautitour.com.br>`
   - `NEXT_PUBLIC_SITE_URL=https://nautitour.com.br` (no swap final)
4. Implementar **lead recapture e-mail** (PR-L original): RPC `create_lead_invitation_for_customer` + endpoint `/claim?token=...` + template + disparo automático após booking confirmed pra customers `is_guest=true`. Tabela `lead_invitations` já existe (migration 005), só falta lógica.

### Env vars em produção (Vercel) — estado atual

| Variável | Status | Notas |
|---|---|---|
| `PAGARME_MODE` | ✅ `live` |  |
| `PAGARME_API_KEY` | ✅ |  |
| `PAGARME_WEBHOOK_USER` / `PAGARME_WEBHOOK_PASSWORD` | ✅ |  |
| `NEXT_PUBLIC_PAGARME_PUBLIC_KEY` | ✅ | pk_ |
| `PAGARME_ALLOWED_EMAILS` | 🟡 | Setado mas ignorado em modo `live`. Mantém pra reverter pra `allowlist` se precisar |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ |  |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ |  |
| `RESEND_API_KEY` | ✅ | Sensitive |
| `RESEND_SENDER` | ✅ | `Nautitour <onboarding@resend.dev>` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | `https://nautitour-website.vercel.app` |
| `BOOKING_SESSION_SECRET` | 🟡 | Não setado; fallback pra `SUPABASE_SERVICE_ROLE_KEY` |

Webhook configurado em `https://nautitour-website.vercel.app/api/webhooks/pagarme` com HTTP Basic Auth (todos os eventos marcados; handler ignora os que não trata).

### P5 — Go-live
- Vercel deploy + domínio + region migration Supabase
- SEO (sitemap, OG tags, GA, Sentry)
- Captcha + rate limit (D2, D3)
- CSP definido (D6)
- Mitigar D4/D5
