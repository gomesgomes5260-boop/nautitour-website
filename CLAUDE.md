# CLAUDE.md — Guia rápido pro próximo chat

Onboarding pra retomar o projeto Nautitour sem precisar reler todo histórico. Última atualização: **10/jul/2026**.

## TL;DR

- **🔀 FUSÃO CONCLUÍDA (10/jul, PRs #88–#94)**: o painel externo `nautitour-reservas` (webreservas.xyz, Next 14 + Prisma + NextAuth) foi absorvido por este projeto. Sync via API morto; ticket/QR interno (`/ticket/[code]`, QR = `booking_code`); vendedores/agências (tabela `sellers` + RLS), painel `/vendedor` com reserva manual, check-in QR em `/admin/scan`, payout de comissão via EFÍ (`/admin/comissoes`) e lembrete D-1 via Vercel Cron. Detalhes na seção "Fusão nautitour-reservas".

- Site de reservas de **passeios de barco em Armação dos Búzios** vendendo em produção
- **Stack**: Next.js 16 + React 19 + Tailwind v4 + Supabase (Postgres, `us-west-2`) + Pagar.me v5 + Resend + Vitest (22 testes) + GitHub Actions CI
- **Modo Pagar.me `live`** desde 11/maio. Bookings reais com PIX e cartão funcionando.
- **Brand visual**: charcoal (`#404040`) + red (`#C00010`), Fraunces serif + Montserrat sans + JetBrains Mono. Logo PNG em `public/brand/`.
- **Rebrand visual 100% completo** (customer-facing + admin). Tier 3 backend 5/5 (captcha, Sentry, CSP, refund parcial, paginação). DB advisor 100% limpo (migration 021). Componentes compartilhados: `KpiCard`, `Pagination`, `WhatsAppFab`, `PhotoGallery`, `CookieBanner`.
- **Schedule da escuna**: sáb/dom 09:30+12:00, seg-sex 11:30, capacidade 120, 2h30 de duração
- **Píeres de embarque**: 3 opções, Rua das Pedras default sem taxa, Porto Veleiro e Pescador R$ 10/pax presencial
- **WhatsApp canônico**: `5522998479728` em `src/lib/whatsapp.ts`. FAB global aparece em todas customer-facing pages (esconde em `/admin`, `/checkout`, `/reserva`)
- **LGPD compliant**: cookie consent banner gating GA4 + Microsoft Clarity (consent.analytics). Lead recapture infrastructure pronta (PR #68), envio aguarda Resend domain (PR-Final)
- **Galeria de fotos**: `PhotoGallery` em home + 3 tour pages com lightbox custom, curadorias em `src/lib/photo-gallery.ts`

## ⚠️ Erros que cometi e não devem repetir

1. **Cidade é Armação dos Búzios**, não Maragogi nem Arraial do Cabo. Já corrigi no front + e-mail mas se ver alguma string solta, troca.
2. **`public/_design/`** (com underscore) é **403 no Vercel** porque prefixo `_` é reservado. Use `public/design-docs/` se precisar hostear HTMLs.
3. **Lucide-react v1.8.0** (antiga) — sem ícones de marca (Facebook/Instagram/YouTube). Usar SVG inline pra essas. Upgrade pendente.
4. **Tailwind v4 + reset global** (`* { margin: 0; padding: 0 }`) brigam com classes. Já removi do `globals.css`. Tailwind preflight resolve.
5. **Timezone**: Búzios é **UTC-3 sem DST** (desde 2019). Helpers em `src/components/DateScheduleSelector.tsx` (`brtMidnight`, `dayKey`) usam isso.
6. **`useSyncExternalStore` exige snapshot referencialmente estável** (PR #70 — site quebrou em produção). Se `getSnapshot()` retornar objeto novo via `JSON.parse()` a cada call, React detecta mudança infinita → loop de re-render → crash. Solução padrão: cache module-level comparando raw string. Ver `src/lib/cookie-consent.ts`.
7. **`react-hooks/set-state-in-effect` (ESLint 9 + Next 16)** flagueia `setState` direto dentro de `useEffect` que lê de fonte externa. Use `useSyncExternalStore` (pattern oficial) — mas cuidado com #6 acima.
8. **Lightbox/modal com filhos full-screen** + `stopPropagation` causa bug de stacking (PR #72). Pattern correto: container com dimensões fixas em vw/vh, overlay com `e.target === e.currentTarget` pra fechar, controles com `z-10`.

## 🎯 Como navegar o repo

```
nautitour-website/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── admin/                # Painel (sidebar dark, gate via isAdminUser)
│   │   │   ├── overview/         # Dashboard com KPIs + saídas hoje + receita 14d + atividade
│   │   │   ├── reservas/         # CRUD reservas + export CSV (mostra vendedor/sinal/pickup)
│   │   │   ├── manifesto/        # Calendário mensal + detalhe por saída (edit/delete/pier/check-in)
│   │   │   ├── scan/             # 🆕 Check-in QR (html5-qrcode + código manual) → dispara payout
│   │   │   ├── vendedores/       # 🆕 CRUD vendedores/agências (cria conta auth + sellers)
│   │   │   ├── comissoes/        # 🆕 Payouts PIX EFÍ (sent/pending/failed + retry)
│   │   │   ├── inquiries/        # Leads de lancha privativa
│   │   │   ├── clientes/         # CRM-light
│   │   │   ├── financeiro/       # Receita / refunds
│   │   │   └── config/           # Templates + admins + pricing
│   │   ├── vendedor/             # 🆕 Painel do vendedor (gate getSellerForUser, client USER-SCOPED — RLS isola)
│   │   │   └── reservas/         # listagem + nova (RPC seller_create_booking) + detalhe
│   │   ├── ticket/[code]/        # 🆕 Ticket público de embarque (QR = booking_code, sem PII)
│   │   ├── checkout/[scheduleId]/
│   │   ├── reserva/[code]/       # Página pós-booking
│   │   ├── passeio-escuna/       # Calendário interativo
│   │   ├── passeio-lancha/       # Idem + inquiry WhatsApp
│   │   ├── locacao-escuna/       # Form de lead
│   │   ├── login | signup | esqueci-senha | minha-conta | minhas-reservas
│   │   └── api/
│   │       ├── webhooks/pagarme/ # Webhook de pagamento
│   │       ├── cron/reminders/   # 🆕 Lembrete D-1 (Vercel Cron + Bearer CRON_SECRET)
│   │       ├── auth/signout/
│   │       └── monitoring/       # Sentry tunnel (CSP-friendly)
│   ├── components/
│   │   ├── HeaderClient.tsx      # Top bar red + nav charcoal
│   │   ├── Footer.tsx            # Bg charcoal-900, logo white
│   │   ├── Logo.tsx              # next/image do PNG
│   │   ├── Container.tsx         # Wrapper padding consistente
│   │   ├── HeroSection.tsx       # Home hero full-bleed
│   │   ├── DateScheduleSelector.tsx  # Calendário mensal pra escolha de data
│   │   ├── AdminSidebar.tsx      # Sidebar dark do admin
│   │   ├── KpiCard.tsx           # KPI card canônico (Icon + label + value + sub) — usado em overview/financeiro/clientes
│   │   ├── Pagination.tsx        # Paginação reusável com buildHref callback — usada em /admin/clientes
│   │   ├── WhatsAppFab.tsx       # Balão flutuante global de WhatsApp (esconde em /admin /checkout /reserva)
│   │   └── ... (TurnstileWidget, etc)
│   └── lib/
│       ├── supabase/{server,admin,client}.ts
│       ├── supabase/database.types.ts  # gerado via MCP
│       ├── pagarme/{client,config,tokenize}.ts
│       ├── email.ts + email-flow.ts
│       ├── email-templates/
│       │   ├── booking-confirmation.ts
│       │   └── schedule-changed.ts
│       ├── piers.ts              # helpers de formatação de taxa
│       ├── format-duration.ts    # "150 → 2h30"
│       ├── rate-limit.ts         # Upstash
│       ├── turnstile.ts          # Cloudflare
│       ├── sentry-scrub.ts       # PII scrub
│       ├── whatsapp.ts           # WHATSAPP_NUMBER + buildWaUrl(text) — canônico
│       ├── admin.ts              # isAdminUser / isOwnerUser (NÃO adicionar callers de seller aqui)
│       ├── staff.ts              # 🆕 getSellerForUser / getUserRole (owner>admin>agency>seller)
│       ├── efi/client.ts         # 🆕 EFÍ Bank — SÓ pix saída (payout) + devolução. mTLS via EFI_CERTIFICATE
│       ├── seller-payout.ts      # 🆕 triggerSellerPayout (claim atômico, nunca lança) + retry
│       └── seller-payout-calc.ts # 🆕 fórmula de comissão em CENTAVOS (testada)
├── public/
│   ├── brand/                    # logo-charcoal.png + logo-white.png + logo-knockout.png
│   ├── design-docs/              # HTMLs de pesquisa hostados em /design-docs/*
│   └── images/photos/            # escuna/, ilhas/, aerea/, misc/
├── design/                       # Material interno (não vai pra produção)
│   ├── brand-guide/              # PNGs oficiais do cliente
│   ├── inspirations/             # Prints de referência
│   ├── icons/coolicons/SVG/      # 442 SVGs de ícones
│   └── research/                 # HTMLs gerados durante UI/UX
├── db/migrations/                # SQL files (rastreamento, aplicação via MCP)
│   ├── 017_escuna_schedule_factory.sql
│   ├── 018_embarkation_piers.sql
│   ├── 019_schedule_edit_delete_rpcs.sql
│   └── 020_templates_crud_and_create_schedule.sql
├── scripts/
│   └── extract-logo-variants.mjs # Chroma key pra extrair logo do brand guide
└── STATUS.md                     # Estado atual + histórico de tiers
```

## 🔑 Decisões técnicas chave

### Banco (Supabase project `uydvnjcqrfjacwburvuo` = Nutitour)
- **RLS habilitado** em todas tabelas. Public reads: `tours`, `tour_schedules`, `embarkation_piers`
- **Soft-hold**: `bookings.expires_at` + `pg_cron` cancela pending_payment expirado
- **Schedule factory**: `ensure_escuna_schedules(N)` roda 06:00 UTC, mantém 90 dias à frente
- **Idempotência email**: RPC `confirm_booking_payment_v2` retorna boolean — só envia e-mail se foi a primeira confirmação
- **Pier default**: trigger `tg_set_default_embarkation_pier` preenche `rua-pedras` se NULL
- **Booking events**: log de tudo (`payment_paid`, `pier_changed`, `schedule_changed`, etc) em `booking_events.kind`
- **Admin gate**: tabela `admins` + helper `is_admin(uuid)`. Trigger auto-promove `gomesgomes5260@gmail.com` a owner

### Frontend
- **Tailwind v4 CSS-first** — tokens em `src/app/globals.css` via `@theme` block
- **Fontes via next/font/google** em `src/app/layout.tsx` (Fraunces + Montserrat + JetBrains Mono + legacy aliases)
- **Server Components** padrão; client components só onde precisa interatividade (modals, forms, calendar)
- **`Container` component** garante padding consistente (`px-6 sm:px-8 md:px-10 lg:px-12`) — use sempre
- **Tipografia fluida** via `clamp(min, vw, max)` inline `style` — evita pulos no breakpoint

### Server actions / RPCs
- **Auth gate em toda action admin**: `requireAdmin()` ou `isAdminUser(user.id)`
- **`'use server'` actions** chamam RPCs Supabase (não SQL direto) — RPC tem guard de admin redundante
- **Captcha + rate limit** em actions de criação (`createBookingAction`, `createInquiryAction`, auth/payment)

### Pagar.me
- **Modo `live`** em produção. `PAGARME_ALLOWED_EMAILS` setado mas ignorado em live (era pra allowlist em dev)
- **Idempotency key** com hash do `card_token` evita duplicação em retentativas
- **PIX `expiresInSeconds: 600`** alinhado ao soft-hold de 10min
- **Webhook** valida basic auth + chama `confirm_booking_payment_v2`

### Email (Resend)
- **Sender atual**: `Nautitour <onboarding@resend.dev>` (free tier — só entrega pra emails da conta Resend)
- **Pendente** trocar pra domínio próprio (PR-Final, aguarda DNS)
- **Templates**: `booking-confirmation.ts` (compra), `schedule-changed.ts` (admin muda data/hora)

## 🛠️ Como rodar

```bash
npm install
npm run dev          # localhost:3000
npm run build        # checa types + bundles
```

Env vars críticas (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PAGARME_API_KEY=
PAGARME_MODE=live
NEXT_PUBLIC_PAGARME_PUBLIC_KEY=
PAGARME_WEBHOOK_USER=
PAGARME_WEBHOOK_PASSWORD=
RESEND_API_KEY=
RESEND_SENDER='Nautitour <onboarding@resend.dev>'
NEXT_PUBLIC_SITE_URL=https://nautitour-website.vercel.app
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

Todas no-op se ausentes (Turnstile, Upstash, Sentry) — dev local funciona sem.

## 🚦 Workflow de PRs

1. **Branch nova partindo de main**: `git checkout -B claude/<descritivo>`
2. **Migrations via MCP** Supabase (`apply_migration`) + **SQL no `db/migrations/`** pra rastreio histórico (não é executável — só doc)
3. **Types regenerados** via MCP após migration (`generate_typescript_types`) — `src/lib/supabase/database.types.ts`
4. **`npm run build`** antes de commit. Build limpo é obrigatório.
5. **Commit** com mensagem multilinha estilo "categoria: descrição curta" + body explicando contexto
6. **Push** + **abrir PR** via MCP GitHub. NÃO mergear sem confirmação do user.

## 🧪 Test plan padrão

- Sem env vars opcionais (Turnstile/Upstash/Sentry): tudo no-op silencioso
- `npm run build` passa
- Após merge: smoke test em `nautitour-website.vercel.app`
- Pagamento real R$ 1 em `tour-de-teste` quando tocar em fluxo de payment

## 📚 Docs principais

- **`STATUS.md`** — Estado atual + roadmap + histórico de tiers
- **`admin-dashboard.md`** — Spec do painel admin (parcialmente implementado)
- **`docs/design-system/README.md`** — Design system docs
- **`design/brand-guide/README.md`** — Brand guide oficial (canônico)
- **`design/research/`** — HTMLs de pesquisa UI/UX (também hostados em `/design-docs/`)
- **`db/migrations/README.md`** — Convenção de migrations

## 🔀 Fusão nautitour-reservas (concluída 10/jul/2026 — PRs #88–#94)

O painel externo `nautitour-reservas` (webreservas.xyz — Next 14, Prisma, NextAuth, banco Supabase separado "Reservas Escuna" sa-east-1) foi **absorvido por este projeto**. Ele nunca entrou em uso ativo, então não houve migração de dados. Plano completo em `/root/.claude/plans/quero-unir-esses-dois-spicy-pancake.md`.

### O que mudou
| Área | Como funciona agora |
|---|---|
| Ticket/QR | `/ticket/[code]` público, QR codifica o **booking_code** (email + página da reserva apontam pra ele). Só renderiza confirmed/completed; dados mínimos sem PII |
| Sync externo | **Morto** (PR #88). Colunas `nautitour_*` ainda existem — drop preparado em `029_drop_nautitour_columns.sql` (não aplicado) |
| Vendedores | Tabela `sellers` (roles `agency`/`seller`, `agency_id` self-ref, `neto_value_cents`, `pix_key`) **separada de `admins`** de propósito — `is_admin`/`isAdminUser` não ganharam callers novos. Guards `is_seller()`/`seller_id_for()` |
| Painel vendedor | `/vendedor` — client **user-scoped**: a RLS `bookings_seller_select` é a barreira de isolamento (agência vê os sellers dela). Reserva manual via RPC `seller_create_booking` (mesmo lock FOR UPDATE do checkout, status confirmed direto, `expires_at` NULL, sinal em `amount_paid_cents`) |
| Cliente sem email | Placeholder `sem-email+...@no-email.invalid` (RFC 2606) — fluxos de email pulam `.invalid` |
| Check-in | `/admin/scan` (html5-qrcode + código manual) → RPC `admin_check_in_booking` (idempotente, retorna `first_checkin`). Manifesto mantém embarcados na lista (badge) + check-in manual |
| Comissão | No 1º check-in: `payout = min(sinal, max(0, total − neto×inteiras − floor(neto/2)×meias))` → PIX via EFÍ. Duplicação impossível: `seller_payouts.booking_id UNIQUE` + claim atômico. Falha → `pending`/`failed` com retry em `/admin/comissoes`. **Erro EFÍ nunca bloqueia check-in** |
| EFÍ | SÓ pix saída (payout) — cobrança segue 100% Pagar.me. Envs `EFI_*` (ver `.env.example`). ⚠️ endpoint de envio corrigido na portagem (`PUT /v2/gn/pix/:idEnvio`); **validar em sandbox antes de produção** |
| Lembrete D-1 | Vercel Cron 18:00 UTC → `/api/cron/reminders` (Bearer `CRON_SECRET`), idempotente via `bookings.reminder_sent_at` |
| Login | Vendedor sem redirect explícito cai em `/vendedor` |

### Migrations da fusão
024 sellers+RLS · 025 seller_create_booking · 026 check-in RPC · 027 seller_payouts+claim · 028 reminder_sent_at · **029 (drop nautitour_*) PREPARADA, NÃO APLICADA**

### Pendências pós-fusão
1. **Smoke tests manuais** (nunca rodados): criar vendedor → logar → reserva manual → isolamento com 2 sellers → scan do QR → payout em **sandbox EFÍ** (`EFI_SANDBOX=true`) → cron com `curl -H "Authorization: Bearer $CRON_SECRET"`.
2. **Envs no Vercel**: setar `CRON_SECRET` e `EFI_*` (quando ativar payout); **remover** `NAUTITOUR_API_URL/KEY/SYNC_ENABLED`.
3. **Aposentadoria (destrutivo — só com confirmação do user)**: aplicar migration 029; arquivar repo `nautitour-reservas`; pausar projeto Supabase "Reservas Escuna" (`zkvoergsfratdkhsgefg`); desativar deploy/domínio webreservas.xyz.
4. **Backlog V2 da fusão**: cobrança de sinal PIX via EFÍ (webhook + `/pay`), white-label de agência, PWA, lembrete 30min, ledger de comissão manual, PDF do ticket.

## 🎯 Próximos passos

1. **🎯 Épico: Blog/Conteúdo (planejado, 3 PRs — não iniciado)** — decisões consolidadas no fim da sessão 17/maio:
   - Editor: **BlockNote** (block-based estilo Notion, drag handles built-in, ~200KB gzip). Fallback Tiptap puro se React 19 + Next 16 der incompatibilidade
   - Storage: **Supabase Storage** bucket público `blog-images`, upload via server action (não expõe service role)
   - Features V1: draft/publicado, slug customizável + SEO meta (title, description, OG image), categorias, **imagem de capa obrigatória**
   - **PR 1 — Foundation**: migration 023 (`blog_posts` + `blog_categories` + RLS + bucket Supabase Storage) + types + helpers em `src/lib/blog.ts`
   - **PR 2 — Admin CRUD + Editor BlockNote**: `/admin/blog` listagem, `/admin/blog/novo`, `/admin/blog/[id]/editar`, `/admin/blog/categorias` + uploads
   - **PR 3 — Pública**: `/blog` paginada + `/blog/[slug]` com SSR/metadata dinâmica + render BlockNote readonly + sitemap.xml + link header/footer

2. **PR-Final** (swap apex `nautitour.com.br` + Resend verificado + envio efetivo do email lead-recovery) — aguarda DNS mpjunior. Infra de lead capture já implementada na PR #68 (RPC + onBlur + storage); só falta o disparo do email quando Resend domain ficar verificado.

3. **Migração Supabase pra `sa-east-1`** — adiada. Plano completo em `/root/.claude/plans/merge-feito-fluxo-de-goofy-valley.md` (inventário, fases, riscos). **Pré-requisito imediato**: setar `BOOKING_SESSION_SECRET` no Vercel agora (evita invalidar sessions ao trocar service key).

### Follow-ups menores (qualidade de vida, sem urgência)
- **Setar `NEXT_PUBLIC_CLARITY_ID`** no Vercel (criar conta free em clarity.microsoft.com) — infra da PR #67 já pronta
- **Billing alerts** Vercel + Supabase pra controlar custo
- **Sentry rate limit** no SDK pra evitar storm de erros virar custo
- Refatorar os 5 callers existentes de `wa.me` (`passeio-lancha`, `locacao-escuna`, `reserva/pagamento`, `admin/inquiries`) pra usarem `buildWaUrl()` de `src/lib/whatsapp.ts` — centraliza número canônico
- Promover CSP de `Content-Security-Policy-Report-Only` pra `Content-Security-Policy` (enforce) após ~2 semanas observando violations
- Tracking de clicks no FAB de WhatsApp (Sentry breadcrumb) se quiser medir conversão
- Tier 3 admin avançado: templates de horário editáveis na UI, heatmap semanal toggle, roles extras (comandante/financeiro)

### Histórico recente (15-17/maio — 15 PRs mergeadas)
| # | Frente |
|---|---|
| #58, #59 | PR-AUDIT-1: Google Analytics 4 base (depois refatorado pra consent-gated em #66) |
| #60 | PR-AUDIT-2: ConfirmModal extraído + refatoração de cancelamentos |
| #61 | PR-AUDIT-3: trust signals inline + `/termos-de-uso` + prefers-reduced-motion |
| #62 | PR-FUP-1/db-hygiene: migration 021 — RLS otimizadas, covering indexes, search_path. Advisor 100% limpo |
| #63 | PR-FUP-2: remove fonts Plus_Jakarta+Inter + 14 CSS aliases legacy (~150KB economizados) |
| #64 | PR-FUP-3: GitHub Action `ci.yml` lint+build em PR + ESLint 9 flat config |
| #65 | PR-FUP-4: Vitest + 15 testes unitários iniciais |
| #66 | feat: cookie consent banner + GA gate + LGPD (PR 1/3 captação) |
| #67 | feat: Microsoft Clarity heatmap + CSP update (PR 3/3 captação) |
| #68 | feat: lead recapture com onBlur + migration 022 (PR 2/3 captação) |
| #69 | fix(cookies): compactar banner pra não cobrir CTAs do hero |
| #70 | 🚨 hotfix(cookies): cachear getConsent — corrige loop infinito que crashava o site (Site fora do ar!) |
| #71 | feat: photo gallery com carousel + lightbox em 4 páginas |
| #72 | 🚨 hotfix(lightbox): X e click-fora não fechavam — container cobria botões |

### Histórico — sessão 13/maio (11 PRs)
| # | Frente |
|---|---|
| #47, #48 | Rebrand customer-facing (fluxo de compra + auth) |
| #49 | PR-S: CSP + Origin check + HSTS preload (fecha pentest D6/D11/D12) |
| #50 | PR-T: refund parcial UI |
| #51 | PR-U: paginação `/admin/clientes` + componente `Pagination` |
| #52-#55 | Rebrand admin completo (financeiro/reservas/inquiries/clientes) + extrai `KpiCard` |
| #56 | Balão flutuante de WhatsApp global |
| #57 | Fix Turnstile responsivo (size: flexible) |

## 🆘 Onde achar contexto histórico

- **STATUS.md** seção "Estado atual" pra resumo executivo
- **STATUS.md** abaixo do separator pra log cronológico desde go-live
- **Git log**: `git log --oneline -50` lista PRs recentes
- **PRs no GitHub**: títulos descritivos sempre explicam o que foi feito

---

**Nota pro próximo Claude**: o user prefere PRs pequenas (1 área por PR), commits descritivos, e que eu confirme antes de tomar ações destrutivas (delete, push --force, etc). Use o GitHub MCP pra abrir PRs sempre. Quando o GitHub MCP estiver desconectado, instrua o user a abrir manualmente via URL.
