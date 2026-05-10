# Painel Administrativo — Nautitour Passeios

> Especificação de implementação para o dashboard interno usado pela equipe da Nautitour (operadores, comandantes, financeiro). Esta é a fonte de verdade para o handoff: layout, componentes, dados, estados e regras de negócio.
>
> **Stack alvo:** React 18 + design system Nautitour (`colors_and_type.css`, classes `.nt-*`).
> **Idioma da UI:** PT-BR.
> **Voz:** profissional, direta — diferente do site público (que é mais editorial e quente). Aqui é ferramenta de trabalho.

---

## 1. Estrutura geral

Layout de duas colunas, **sidebar fixa à esquerda** + **área principal scrollável**.

```
┌────────────┬──────────────────────────────────────────┐
│            │  TopBar (título + ações)                 │
│  Sidebar   ├──────────────────────────────────────────┤
│  240px     │                                          │
│  charcoal  │  Conteúdo da seção ativa                 │
│  -700      │  (cards em grid, padding 32)             │
│            │                                          │
│  [logo]    │                                          │
│  nav...    │                                          │
│  [perfil]  │                                          │
└────────────┴──────────────────────────────────────────┘
```

### Sidebar (240px, `--charcoal-700`, texto branco)

- **Topo:** logo branca + wordmark "NAUTITOUR" + tag "Admin" em uppercase letterspaced.
- **Navegação** (botões em coluna, gap 6px):
  1. `overview` — Visão geral (default)
  2. `reservas` — Reservas
  3. `agenda` — Agenda
  4. `clientes` — Clientes
  5. `financeiro` — Financeiro
  6. `config` — Configurações
- **Estado ativo:** background `--red-600`, texto branco.
- **Estado inativo:** background transparente, texto `rgba(255,255,255,0.7)`.
- **Cada item:** ícone (15px) + label (Montserrat 700, 13px), padding 10/14, radius 8.
- **Rodapé da sidebar (sticky bottom):** card semi-transparente com avatar do usuário logado, nome ("Cap. Rafael"), cargo ("Operador"), botão "Sair".
- **Mobile (<640px):** sidebar vira top bar horizontal scrollável; perfil omitido.

### Top bar da área principal

- **Esquerda:** `<h1>` com nome da seção (Fraunces 600, 36px desktop / 26px mobile) + subtítulo cinza com data atual e contexto operacional ("sábado de operação normal").
- **Direita:** botões de ação:
  - 🔍 Buscar (outline icon button)
  - 🔔 Notificações (outline icon button + dot vermelho se tiver não lidas)
  - **+ Nova reserva** (primary CTA, vermelho)

---

## 2. Seções (rotas internas)

### 2.1 Visão geral (`overview`)

Dashboard de abertura. **Mostra o pulso do dia.**

**Bloco 1 — KPIs (grid 4 colunas, 2 no mobile):**

| KPI | Valor exemplo | Delta | Ícone |
|---|---|---|---|
| Receita do mês | R$ 184.260 | +12,4% ↑ | card |
| Reservas hoje | 38 | +5 vs ontem ↑ | ticket |
| Ocupação média | 86% | +3 pp ↑ | users |
| Reembolsos | R$ 1.240 | -18% ↓ (verde) | refund |

Cada KPI = card branco, padding 18, com:
- Label uppercase letterspaced 11px charcoal-400
- Valor em Fraunces 700, 28px
- Delta com seta ↑/↓ (verde se positivo, vermelho se negativo) — exceto reembolsos onde queda é positiva
- Ícone em quadrado charcoal-50 32×32 no canto superior direito

**Bloco 2 — Saídas de hoje + Gráfico (grid 1.4fr 1fr):**

**Card "Saídas de hoje"** (lista, sem padding, divididores entre linhas):
- Header com badge verde "3 ativas"
- Cada linha: hora (mono 18px) | nome do passeio + comandante | barra de ocupação (booked/capacity + %) | badge de status
- Status: `sailing` (verde "Navegando"), `soldout` (vermelho "Esgotado"), `open` (cinza "Aberta")
- Barra de ocupação muda de cor: verde <80%, amarelo 80-99%, vermelho 100%

**Card "Receita · últimos 14 dias":**
- Subtítulo com total da semana
- Bar chart simples de 14 barras, altura 140px
- Barras de fim de semana em charcoal-700 (mais escuras)
- Barra do dia atual em vermelho
- Demais em charcoal-300

**Bloco 3 — Atividade recente (card largura total):**

Feed cronológico com 5 itens:
- Avatar circular 36px com ícone (cor depende do tipo: `new`/red, `cancel`/gray, `paid`/green)
- Título da ação + meta com nome e ID monoespaçado
- Timestamp relativo ("há 2 min", "há 1h") alinhado à direita
- Botão "Ver tudo" no header

Tipos de evento:
- `new` — Nova reserva criada
- `paid` — Pagamento aprovado
- `cancel` — Cancelamento solicitado / reembolso

---

### 2.2 Reservas (`reservas`)

**Tabela master** de todas as reservas. É a tela mais usada pelo balcão.

**Header da tabela:**
- **Filter chips** (pílulas roláveis):
  `Todas · {n}` | `Pendentes · {n}` | `Confirmadas · {n}` | `Embarcadas · {n}` | `Concluídas · {n}` | `Canceladas · {n}`
  - Estado ativo: charcoal-700 fill, branco
  - Inativo: outline charcoal, texto charcoal-500
- **Ações à direita:** "Filtros" (outline) + "Exportar CSV" (outline)

**Tabela (overflow-x: auto, min-width 720px):**

| Coluna | Conteúdo |
|---|---|
| ID | mono, ex: `NT-2026-1849` |
| Cliente | avatar 32px + nome (700) + país (11px charcoal-400) |
| Passeio | nome do passeio |
| Saída | data curta + horário mono em segunda linha |
| Pessoas | número |
| Valor | mono BRL, fontWeight 700 |
| Status | badge colorida (ver mapa abaixo) |
| Menu | botão ghost com ícone "more" (3 pontos) |

**Mapa de cores de status:**
- `confirmed` → badge verde "Confirmada"
- `pending` → badge amarelo "Pendente"
- `sailing` → badge vermelha "Embarcada"
- `completed` → badge cinza "Concluída"
- `cancelled` → badge cinza "Cancelada"

**Linha de header:** background charcoal-50, labels uppercase 11px letterspaced.

**Interação:** clicar em qualquer linha abre drawer lateral com detalhes da reserva (a implementar — ver §6).

---

### 2.3 Agenda (`agenda`)

**Heatmap semanal de ocupação.** Visão de "quanto está cheio" para os próximos 7 dias.

**Layout:**
- Grid `80px repeat(7, 1fr)` (uma coluna fixa de horários + 7 colunas de dias)
- Header dos dias: dia da semana (3 letras, uppercase) + número grande em Fraunces
- Coluna do dia atual destaca em vermelho (background `--red-50`, número em vermelho)

**Linhas de horário:** `09:00`, `10:00`, `11:30`, `13:00`, `14:30`, `16:30`

**Cada célula:**
- Mostra produto ("Escuna" ou "Lancha") + percentual de ocupação grande em Fraunces
- Cor de fundo varia por ocupação:
  - **<30%** → charcoal-100 (texto charcoal-500)
  - **30–69%** → `--success` verde (texto branco)
  - **70–94%** → `--warning` amarelo (texto branco)
  - **≥95%** → `--red-600` (texto branco, ESGOTADO)
  - **Off** → charcoal-50 com "Off" em charcoal-300 (saída cancelada/fora de operação)

**Legenda no rodapé:** 5 swatches com labels.

**Interação:**
- Clicar célula abre modal com lista de reservas daquele horário + ação de bloquear/cancelar saída
- Drag para selecionar múltiplas células e bloquear em lote (futuro)

---

### 2.4 Clientes (`clientes`)

**KPIs de relacionamento (4 cards):**
- Total de clientes (3.842)
- Recorrentes (24%)
- Ticket médio (R$ 312)
- NPS (76)

**Card "Top clientes":**
- Header com input de busca (240px) "Buscar nome, e-mail, CPF..."
- Tabela com colunas:
  - Cliente (avatar + nome)
  - Origem (cidade · país)
  - Reservas (count)
  - Gasto total (BRL, **vermelho 700**)
  - Última visita (data ISO)
  - Tags (badges cinza pequenas: `VIP`, `Recorrente`, `Lancha`, `Família`, `EN`...)

**Interação:** clicar cliente abre drawer com histórico completo de reservas, dados de contato, observações internas.

---

### 2.5 Financeiro (`financeiro`)

**KPIs:**
- Receita do mês
- A receber (com count: "14 reservas")
- Reembolsos (delta verde se queda)
- Margem (%)

**Card "Receita por método" (esquerda, 1.4fr):**
- 4 linhas: Pix (52%), Cartão de crédito (38%), Dinheiro balcão (6%), Transferência (4%)
- Cada linha = label + valor BRL + (%) + barra horizontal colorida
- Pix usa vermelho-600, cartão usa charcoal-700, demais em tons de cinza

**Card "Receita por produto" (direita, 1fr):**
- **Donut chart SVG** (raio 60, stroke 22)
- Segmentos:
  - Escuna 64% (charcoal-700)
  - Lancha Privativa 30% (red-600)
  - Add-ons 6% (charcoal-300)
- Legenda lateral com swatch + label + percentual

**Tabela "Últimas transações":**
- Colunas: Data (mono), Reserva (ID mono), Cliente, Método, Valor, Status (badge verde "Aprovado" / amarelo "Pendente")
- Sem paginação no MVP — mostrar últimas 20

---

### 2.6 Configurações (`config`)

Grid 2 colunas (1 no mobile) com 4 cards de configuração:

**Card "Preços e capacidade":**
- Inputs: Escuna Adulto, Escuna Criança, Capacidade da escuna, Lancha 5h
- Salvar inline ou ao trocar foco

**Card "Saídas e horários":**
- Lista de produtos com horários padrão e dias de operação
- Ex: "Escuna · Seg-Dom · saídas 10:00, 13:00"
- Botão "Editar" em cada produto

**Card "Equipe":**
- Lista de colaboradores com avatar, nome, cargo
- Comandantes, bar a bordo, etc.
- Botão "+ Adicionar"

**Card "Política de cancelamento":**
- Textarea com 6 linhas
- Default: "Reembolso integral até 24h antes... etc"
- Botão "Salvar" primary

---

## 3. Modelo de dados

### Reservation
```ts
type Reservation = {
  id: string;             // "NT-2026-1849"
  client: string;         // nome completo
  country: string;        // "Brasil", "Argentina", "EUA"...
  email?: string;
  phone?: string;
  tour: 'Escuna' | 'Lancha 3h' | 'Lancha 5h' | 'Lancha 8h' | 'Lancha Pôr do Sol';
  date: Date;
  time: string;           // "10:00"
  people: number;
  adults: number;
  children: number;
  total: number;          // em BRL (number)
  paymentMethod: 'pix' | 'card' | 'cash' | 'transfer';
  paymentStatus: 'pending' | 'approved' | 'refunded';
  status: 'pending' | 'confirmed' | 'sailing' | 'completed' | 'cancelled';
  createdAt: Date;
  notes?: string;         // observações internas
};
```

### Departure (saída programada)
```ts
type Departure = {
  id: string;
  tour: 'Escuna' | 'Lancha';
  date: Date;
  time: string;
  capacity: number;       // 50 escuna, 8 lancha
  booked: number;
  captain: string;
  status: 'open' | 'sailing' | 'soldout' | 'off';
  reservationIds: string[];
};
```

### Client
```ts
type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  country: string;
  city?: string;
  totalReservations: number;
  totalSpent: number;
  lastVisit: Date;
  tags: string[];         // ['VIP', 'Recorrente', 'Lancha', 'EN'...]
  notes?: string;
};
```

### Transaction
```ts
type Transaction = {
  id: string;
  reservationId: string;
  date: Date;
  client: string;
  method: 'Pix' | 'Cartão 3x' | 'Cartão 6x' | 'Dinheiro' | 'Transferência';
  value: number;
  status: 'Aprovado' | 'Pendente' | 'Reembolsado';
};
```

---

## 4. Componentes reutilizáveis

| Componente | Props | Onde aparece |
|---|---|---|
| `<KPI label value delta up icon />` | label string, value string (já formatado), delta string, up boolean, icon name | Overview, Clientes, Financeiro |
| `<Avatar name size />` | nome (gera iniciais + cor determinística) | sidebar, tabelas, drawers |
| `<Icon name size />` | nomes: `grid, ticket, cal, users, card, settings, search, bell, plus, x, check, more, filter, download, refund, clock, trending, star, arrow-r` | em todo lugar |
| `<BarChart data />` | array de números | Overview |
| `<DonutChart data />` | `[{label, value, color}]` (% sum=100) | Financeiro |
| `<Legend color label />` | swatch + label | Agenda |
| `.nt-badge` + modificador | `--green --yellow --red --gray` | tabelas |
| `.nt-card` | white, radius 16, shadow-2 | container padrão |
| `.nt-btn` + modificador | `--primary --outline --ghost` | ações |

### Helpers de formatação

```ts
fmtBRL(n: number): string         // 184260 → "R$ 184.260"
fmtDateLong(d: Date): string      // "10 de maio de 2026"
fmtDateShort(d: Date): string     // "10/05"
fmtRelative(d: Date): string      // "há 2 min", "ontem"
ptDay = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
```

---

## 5. Tokens visuais (do design system)

**Cores principais:**
- `--charcoal-700: #404040` — texto, sidebar, headers de tabela
- `--charcoal-50: #F4F4F4` — backgrounds de seção
- `--charcoal-400: #808080` — texto secundário
- `--red-600: #C00010` — CTAs, status críticos, accents
- `--success: #1F8A5B` — confirmações, deltas positivos
- `--warning: #D89B1F` — ocupação alta, pendências

**Tipografia:**
- `--font-display: 'Fraunces', serif` — h1, valores de KPI, títulos de card (apenas weight 600/700)
- `--font-body: 'Montserrat', sans-serif` — todo o resto, weights 600/700/800
- `--font-mono: 'JetBrains Mono', monospace` — IDs, horários, datas em tabelas

**Sombras:**
- `--shadow-1`, `--shadow-2` (cards padrão), `--shadow-3` (modais/drawers)

**Radii:** 4 (chips em tabela), 8 (botões/inputs), 12 (cards pequenos), 16 (cards grandes), 999 (pills).

**Spacing:** 8-point system. Padding interno de cards: 18 (KPI), 24 (cards de conteúdo). Gap entre cards: 16-20.

---

## 6. Comportamentos não implementados (próximos passos)

1. **Drawer de reserva** — slide-in 480px da direita ao clicar linha. Mostra dados completos, timeline de eventos (criada → paga → confirmada → embarcada → concluída), botões: Reenviar voucher, Cancelar, Reembolso, Editar passageiros.
2. **Modal de saída** — ao clicar célula da agenda. Lista reservas daquela saída, permite bloquear/cancelar com motivo.
3. **Nova reserva (modal)** — formulário em wizard de 3 passos: passeio+data → cliente → pagamento. Reaproveita o fluxo do site público.
4. **Notificações em tempo real** — websocket. Toast inferior direito + dot vermelho no sino.
5. **Permissões por papel** — `admin`, `operador`, `comandante`, `financeiro`. Sidebar e ações filtradas.
6. **Multi-idioma na UI admin** — só PT-BR no MVP.
7. **Exportar CSV** — gera CSV com filtros aplicados.
8. **Busca global** (Cmd+K) — abre palette com reservas, clientes, transações.
9. **Dark mode** — não previsto.

---

## 7. Estados vazios e de carregamento

| Tela | Empty state |
|---|---|
| Reservas (filtro sem resultado) | Ilustração de âncora cinza + "Nenhuma reserva neste filtro" + botão "Limpar filtros" |
| Clientes (busca sem match) | "Nenhum cliente encontrado para `{query}`" |
| Agenda (dia sem operação) | célula off + tooltip "Fora de operação" |
| Atividade recente (zero events) | "Tudo quieto por aqui." |

**Loading:** skeletons cinza claros (charcoal-100) com shimmer sutil. KPIs viram blocos 28px h. Tabelas viram 5 linhas de skeleton.

---

## 8. Acessibilidade

- Todos os botões ícone-only têm `aria-label`
- Foco visível: outline 2px `--red-600` offset 2px
- Tabelas têm `<th scope="col">`
- Status colors **nunca são o único sinal** — sempre acompanhados de label texto
- Contraste mínimo AA: charcoal-400 sobre branco passa; charcoal-300 NÃO — usar apenas para decorativos

---

## 9. Responsividade

- **≥1200px:** layout completo conforme spec
- **768–1199px:** sidebar colapsa para 200px, KPIs em 2×2
- **<768px (mobile):** sidebar vira top bar horizontal scrollável, cards empilham, tabelas viram cards (1 reserva = 1 card com label/valor)

---

## 10. Acceptance criteria

- [ ] Sidebar persiste seção ativa em URL (`/admin/reservas`, `/admin/agenda`...)
- [ ] Filtros de reservas atualizam URL como query string
- [ ] Tabela de reservas pagina a cada 50 itens
- [ ] KPIs carregam de API independentemente (não bloqueiam render)
- [ ] Botão "Nova reserva" abre fluxo em qualquer seção
- [ ] Notificações têm contador correto e marcam como lido ao abrir
- [ ] Busca de clientes é debounced (250ms)
- [ ] Donut e bar charts são SVG inline (sem libs)
- [ ] Toda data/hora respeita timezone America/Sao_Paulo

---

## Anexo A — Arquivos de referência neste projeto

- `app/pages-admin.jsx` — implementação React de referência (todas as 6 seções)
- `app/components.jsx` — `Logo`, `Avatar`, `Icon`, `Badge`
- `assets/app.css` — classes `.nt-card`, `.nt-btn`, `.nt-badge`, `.nt-input`, `.nt-label`, `.nt-text-mono`, `.nt-stack-2`
- `colors_and_type.css` — todos os tokens CSS

> Use o JSX como espelho visual — copie classes e estrutura, troque mocks por chamadas reais à API.
