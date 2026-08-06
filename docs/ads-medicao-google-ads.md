# Medição de conversão — Google Ads (conta "Escuna" `4882012999`)

Registro do trabalho de **correção da medição** feito em **06/ago/2026**. Objetivo:
fazer o ROAS refletir a receita real. Diagnóstico via Adspirer + ajustes no painel
do Google Ads e no código do site.

## 🔎 Diagnóstico — por que o ROAS aparecia como ~0,2x

O ROAS baixo **não era campanha ruim** — era **medição quebrada**. Três causas:

1. **A ação "Compra" usava valor FIXO de R$60** (`always_use_default_value = true`).
   O site manda o total real da reserva (`total_cents` = nº de passageiros × R$60),
   mas o Google descartava e contava R$60 fixo. Toda reserva de 2+ pax era subcontada
   (2 pax = R$120 → contava R$60; 3 pax = R$180 → contava R$60).
   *(Obs: o ingresso é mesmo R$60/pessoa — o bug era ignorar a quantidade de pax.)*

2. **7 ações de "engajamento" de baixo valor contando como conversão PRINCIPAL**,
   vindas do Perfil da Empresa (Google Maps), não de venda:
   Local actions (Directions, Menu views, Website visits, Other engagements) e
   Clicks to call a **R$1**, Store visits a **R$12**. Enchiam a coluna "Conversões"
   de ruído e afundavam o ROAS agregado.

3. **A conta otimiza majoritariamente para lead/contato, não para venda.**
   Metas-padrão da conta: Compra (14/35 campanhas), **Lead telefônico (34/35)**,
   **Contato (33/35)**, Leads de mensagens (14/35). O Smart Bidding da maioria das
   campanhas mira ligação/contato (R$0–1), não Compra.

Ações de conversão marcadas como **primárias**: 9 (a maioria é ruído de Maps/contato).
No período 10/jul–06/ago houve **9 Compras reais** vs **103 visitas à loja** + **33 page views**.

## ✅ Correções de MEDIÇÃO aplicadas (seguras — não mexem em orçamento/lance)

| # | Item | Onde | Status |
|---|------|------|--------|
| 1 | **Enhanced Conversions ativado** (método **Tag do Google** / gtag.js) na ação Compra | Painel Google Ads | ✅ feito |
| 2 | **Código in-page de Enhanced Conversions** — envia email/telefone/nome (hash SHA-256 client-side) no evento `purchase`, gateado por consent de retargeting (LGPD) | Código — PR #129 | ✅ mergeado + deployado |
| 3 | **Valor da Compra: fixo R$60 → "valores diferentes por conversão"** (Snippet de evento; fallback R$60) | Painel Google Ads | ✅ confirmado via API |

**Evidência do item 3 (Adspirer `list_conversion_actions`):** a Compra passou de
`60 BRL (always)` para `60 BRL` — o sumiço do `(always)` confirma
`always_use_default_value = false` (agora usa o valor real por reserva).

### Detalhes do PR #129 (código)
- `src/lib/analytics.ts`: `purchase()` aceita `userData` opcional; seta
  `gtag('set', 'user_data', ...)` antes de disparar a conversão AW. Helpers puros
  testados (`buildUserData`, `normalizePhoneE164`) — normalização E.164 BR, lowercase
  de email, skip de placeholder `.invalid` (venda de vendedor sem e-mail).
- `src/app/reserva/[code]/PurchaseTracker.tsx`: gateia o envio de PII por consent
  de retargeting; passa email/telefone/nome.
- `src/app/reserva/[code]/page.tsx`: inclui `phone` no select do customer.
- **"Snippet de evento" é o método correto** no painel — casa com o
  `gtag('event','conversion',{send_to,value,...})` que o site dispara. Não usar
  "Tag do Google" pro valor.

## ⏸️ Pendências — FASE DE ORÇAMENTO (mexem em lance/distribuição; NÃO feitas ainda)

Seguradas de propósito enquanto a distribuição de orçamento não pode ser mexida.
Fazer **deliberadamente, campanha por campanha**, medindo impacto:

1. **WhatsApp / Calls / ações de R$1 (Maps) → Secundária** ("apenas observação").
   Tira o ruído da conta. Muda o sinal do Smart Bidding → afeta gasto.
   - Nota: o site **não** dispara conversão de WhatsApp no código (redirect 302
     server-side em `/api/wa`, só loga em `whatsapp_clicks`). A ação "Whatsapp"
     do Ads é auto-criada pelo Google. O alerta "implemente código in-page" nela
     tem **0% de match** (clique anônimo, sem dado do usuário) — não vale corrigir;
     resolve ao demover pra secundária (ou desativar EC dela).
2. **Reestruturar metas-padrão** pra campanhas de venda mirarem só **Compra**
   (hoje 34/35 miram ligação/contato). Maior alavanca de desperdício de orçamento.

## Observações operacionais
- Mudanças de valor **não retroagem** — valem só pra frente. ROAS leva alguns dias
  pra refletir (acúmulo de dados + reprocessamento do Google).
- Enhanced Conversions da Compra só aparece no diagnóstico com taxa de correspondência
  real depois de acumular dados (janela de 7 dias) com o PR #129 em produção.
- Cota do Adspirer: 15 chamadas/mês — usar com parcimônia nas verificações.
