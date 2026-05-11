# Nautitour — Status do Projeto

Última atualização: 11/maio/2026 madrugada — produção no ar; 2º pentest realizado, fixes críticos aplicados; faltando validação E2E do Pagar.me.

**Legenda:** ✅ pronto · 🟡 parcial · 🔴 falta · ⏸️ bloqueado por dependência externa

---

## 🌅 Onde paramos (retomar amanhã)

**O que foi feito hoje:**
- ✅ PR #1 (16 commits: catálogo + auth + reserva + checkout + pentest + Pagar.me) mergeada em `main`
- ✅ PR #2 (Basic Auth do webhook Pagar.me, substituindo HMAC) mergeada em `main`
- ✅ Deploy de produção no ar: `https://nautitour-website.vercel.app`
- ✅ Env vars no Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAGARME_API_KEY`, `NEXT_PUBLIC_PAGARME_PUBLIC_KEY`, `PAGARME_WEBHOOK_USER`, `PAGARME_WEBHOOK_PASSWORD`, `PAGARME_MODE=allowlist`
- ✅ Webhook criado no painel Pagar.me com Basic Auth e URL `https://nautitour-website.vercel.app/api/webhooks/pagarme`
- ✅ 2º pentest (3 agentes em paralelo) + fixes críticos aplicados na PR #4: amount validation no webhook + RPC, refund cancela booking, `get_booking_by_code` não exposta a anon, ownership cookie nas server actions de pagamento, idempotency-key do cartão com hash do token, assertion `pk_*` no tokenize, middleware exclui `/api`, length caps no `create_booking_pending`. Ver seção 6 abaixo.

**Falta pra finalizar Pagar.me (próxima sessão):**

1. **Mergear PR #3** (STATUS snapshot) e **PR #4** (fixes do 2º pentest).

2. **Adicionar 2 env vars no Vercel** (Production):
   - `PAGARME_ALLOWED_EMAILS` = seu e-mail (separar por vírgula se for mais de um).
   - `BOOKING_SESSION_SECRET` = string longa aleatória (≥48 chars, gerada com `openssl rand -base64 48`). Pode ser omitido — nesse caso o sistema usa `SUPABASE_SERVICE_ROLE_KEY` como fallback. Recomendado setar separado pra poder rotacionar independente.

3. **Teste E2E PIX (R$ 1,00):**
   - Abrir https://nautitour-website.vercel.app/checkout/e55dfc57-fb6c-4133-a353-f957250104c6 (tour-de-teste, 12/05 às 12:00 BRT)
   - Preencher form com o e-mail da allowlist + 1 passageiro = R$ 1,00
   - Pagar via PIX, esperar a página atualizar pra "Pagamento confirmado"
   - Se travar em "pendente": painel Pagar.me → Webhooks → "Tentativas" pra ver o erro

4. **Teste E2E cartão (R$ 1,00):** mesma reserva, método "Cartão".

5. **Trocar `PAGARME_MODE` de `allowlist` pra `live`** quando os dois testes confirmarem.

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

### Faltando
- 🔴 `/termos-de-uso` (legal)
- 🔴 Páginas de admin (passo separado — ver seção 5)

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
| Pagamento PIX | 🟡 | Implementado em modo `allowlist`; falta validação E2E (R$ 1,00) — ver "Onde paramos" |
| Pagamento cartão | 🟡 | Tokenização client-side via `/v5/tokens`; falta validação E2E (R$ 1,00) |
| Webhook Pagar.me → confirmar | 🟡 | `/api/webhooks/pagarme` valida HTTP Basic Auth e chama RPC idempotente; falta validar com chamada real |
| E-mail de confirmação da reserva | 🔴 | Precisa Resend |
| E-mail "complete cadastro" (lead recapture) | 🔴 | Tabela `lead_invitations` pronta, falta envio |
| Soft hold de assentos | 🔴 | Cron de expiração — depois do Pagar.me |
| Cancelamento pelo cliente (UI) | 🔴 |  |
| Reembolso (UI) | 🔴 | Depende Pagar.me |

---

## 3. Banco / backend

### Estrutura
| Item | Status |
|---|---|
| 8 tabelas + 6 enums | ✅ |
| RLS em todas as tabelas | ✅ |
| Triggers (`on_auth_user_created`, `tg_booking_update_seats`, `set_updated_at`) | ✅ |
| Tipos TypeScript gerados | ✅ |

### RPCs (funções públicas)
| Função | Acesso | Uso |
|---|---|---|
| `create_booking_pending` | anon, authenticated | Cria reserva pendente; lock no schedule |
| `get_booking_by_code` | anon, authenticated | Lê reserva por código |
| `create_inquiry_request` | anon, authenticated | Salva lead da locação privativa |

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

Tudo 🔴. Referência em `admin-dashboard.md` (no `main`).

- 🔴 Login admin (role separada)
- 🔴 Lista de reservas (filtros, busca por código/email)
- 🔴 Lista de inquiries (locações)
- 🔴 Calendário de saídas
- 🔴 Manifesto de embarque
- 🔴 Cancelar / reembolsar
- 🔴 Gerenciar tours, schedules, preços
- 🔴 Bloquear datas (feriados, manutenção)

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
| D9 | **Média** | **Oversell silencioso**: 2 clientes podem ter booking `pending_payment` na mesma vaga. Quando o 1º paga e vira `confirmed`, o trigger consome a vaga. Se o 2º também pagar antes do timeout, o `confirm_booking_payment` falha na constraint `seats_within_capacity` — Pagar.me já cobrou mas reserva fica em `pending_payment` pra sempre, sem refund automático | Soft hold com TTL: incrementar `seats_taken` em `pending_payment`, cron decrementa após 15min sem pagamento. Não foi corrigido no PR #4 porque exige cron/edge function e muda UX. Documentar e priorizar P3 |
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
| SMTP em prod (Resend ou similar) | 🔴 |

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
5. **Soft hold** — quanto tempo segurar reserva pendente? Sugestão: 15min escuna, 30min lancha
6. **Lista de admins** — quem terá acesso ao painel
7. **E-mail provider** — Resend, Mailgun, SendGrid, ou SMTP próprio?
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
- 🔴 `PAGARME_ALLOWED_EMAILS` no Vercel (Production)
- 🔴 Teste E2E PIX (R$ 1,00) no tour-de-teste
- 🔴 Teste E2E cartão (R$ 1,00) no tour-de-teste
- 🔴 Trocar `PAGARME_MODE` de `allowlist` pra `live`
- 🔴 Parcelamento (hoje fixo em 1x à vista)
- 🔴 Soft hold + cron de expiração
- 🔴 E-mails transacionais (Resend)
- 🔴 Lead recapture e-mail

### P4 — Admin
- Painel interno seguindo `admin-dashboard.md`
- Role admin + RLS adicional

### Env vars Pagar.me — estado atual em produção (Vercel)

| Variável | Status |
|---|---|
| `PAGARME_MODE` | ✅ `allowlist` |
| `PAGARME_ALLOWED_EMAILS` | 🔴 falta adicionar |
| `PAGARME_API_KEY` | ✅ |
| `PAGARME_WEBHOOK_USER` | ✅ |
| `PAGARME_WEBHOOK_PASSWORD` | ✅ |
| `NEXT_PUBLIC_PAGARME_PUBLIC_KEY` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ |

Notas:
- `PAGARME_MODE=allowlist` enquanto estamos testando — só os e-mails em `PAGARME_ALLOWED_EMAILS` conseguem pagar. Todo o resto vê "em breve".
- Quando os testes E2E passarem, trocar pra `PAGARME_MODE=live`.
- Webhook configurado em `https://nautitour-website.vercel.app/api/webhooks/pagarme` com HTTP Basic Auth (todos os eventos marcados; nosso handler ignora os que não trata).

### P5 — Go-live
- Vercel deploy + domínio + region migration Supabase
- SEO (sitemap, OG tags, GA, Sentry)
- Captcha + rate limit (D2, D3)
- CSP definido (D6)
- Mitigar D4/D5
