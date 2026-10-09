# Social & Criativos — Inventário de assets (09/out/2026, rev. 2)

Primeiro passo do épico **Gestão de criativos para redes sociais e ads** (Meta/Google → site ou WhatsApp).
Objetivo deste documento: saber exatamente o que já existe de marca, design, foto, copy e dados
antes de definir regras, tom de voz e templates — e, depois, automatizar a produção com agentes.

Legenda: ✅ pronto pra usar · 🟡 existe mas precisa de ajuste · 🔴 não existe

---

## 0. Arquitetura de marca — empresa × produto (confirmado pelo dono em 09/out)

| | **Nautitour Passeios** | **Escuna Estrela** |
|---|---|---|
| O que é | A **empresa** de turismo (CNPJ, loja, site, reservas, e-mails, Google Ads "Escuna") | O **produto**: a escuna. É o nome que vai pras **redes sociais e pros criativos** |
| Identidade | Charcoal `#404040` + vermelho `#C00010`, Fraunces + Montserrat, timão/barco (brand guide 2026) | **Estrela-do-mar verde-água** `#20C098` (sombra `#209070`) + cinza `#606060`, "ESCUNA" em sans condensada + "estrela" em script. Logo de 2020 |
| Onde vive hoje | Repo (`public/brand/`, `design/brand-guide/`, `globals.css`) + `.ai` no Drive | **Só no Drive**: `Projeto Claude Ads/Logo Escuna Estrela/` — COR, COR VERTICAL, BRANCO, BRANCO VERTICAL, PRETO, PRETO VERTICAL (PNG) + `LOGOTIPO.cdr` + `LOGOTIPO.pdf` (vetor) + `.psd` |
| Aparece no site? | Sim, em tudo | **Não. Zero menções** a "Escuna Estrela" em `src/` |

**Consequência direta:** o criativo sai verde-água com estrela-do-mar e o clique cai num site charcoal e vermelho com timão. Hoje não existe ponte. Isso é a decisão nº 1 da seção 7 e vira a primeira regra do brand kit (opção 1 da seção 6): **o kit de social é da Escuna Estrela**, com o Nautitour como assinatura institucional ("by Nautitour Passeios") — ou o site ganha a Escuna Estrela na página do passeio. Fatos de produto, roteiro, preços e tom de voz são os mesmos; muda a camada visual.

Duas marcas, dois guias visuais, uma voz. Os folhetos impressos de 2024 (`Impresso/`) são a identidade Escuna Estrela **aplicada**, e o dono confirmou que os criativos devem seguir esse sistema. Está destrinchado em **`01-sistema-visual-impressos.md`**. Detalhe importante: **o co-branding já existe nos impressos** (logo Nautitour ao lado da Escuna Estrela no rodapé), então a ponte entre as marcas está meio construída — falta só o site.

---

## 1. Identidade visual

| Item | Estado | Onde | Observação |
|---|---|---|---|
| Brand guide oficial do cliente (17 PNGs: cores, escalas, gradientes, tipografia, componentes, espaçamento) | ✅ | `design/brand-guide/` | Fonte canônica. Quando código e PNG discordam, o PNG vence |
| Tokens de cor/tipo/radius/sombra em código | ✅ | `src/app/globals.css` (`@theme`), `docs/design-system/colors_and_type.css` | Charcoal `#404040` · Red `#C00010` · Gray `#808080` · Sea (só overlay de foto) · 3 gradientes (`flag`, `iron`, `mare`) |
| Fontes | ✅ | Google Fonts | Fraunces (display) · Montserrat (body, 900 pro wordmark) · JetBrains Mono (códigos) |
| Logo PNG charcoal + white | ✅ | `public/brand/` | Só 2 variantes. Sem versão em vermelho, sem lockup vertical, sem ícone isolado (timão) |
| Logo vetorial Nautitour (.ai master) | 🟡 | Google Drive → `Estrela/Nautitour/Logo/Nautitour Passeios - Logotipo.ai` | **Não está no repo nem convertido pra SVG.** |
| Logo Escuna Estrela (6 PNGs + CDR + PDF vetorial + PSD) | 🟡 | Google Drive → `Projeto Claude Ads/Logo Escuna Estrela/` | **É a logo dos criativos.** Vetor existe (CDR/PDF) mas precisa virar SVG e entrar no repo/bucket. PNG COR tem 845×344 px |
| Patterns (onda, listras, constelação, sol) e spot icons (timão, barco, âncora, drink, sol, ilha) | 🔴 | citados em `docs/design-system/README.md` | Os arquivos SVG **nunca foram versionados** (pasta `assets/` do pacote não entrou). Recriar ou abandonar |
| Favicon / app icon | ✅ | `src/app/icon.png`, `apple-icon.png` | — |
| OG image padrão | 🟡 | `src/app/layout.tsx` | É uma foto crua da escuna no píer (jpg), sem arte de marca. Serve pro site, não serve de criativo |
| Selos de certificação (Cadastur, Marinha, Prefeitura de Búzios, Turista Seguro) | ✅ | `public/images/logos/certifications/` | Bons pra "trust signal" em anúncio |

## 2. Tom de voz e copy

| Item | Estado | Onde | Observação |
|---|---|---|---|
| Diretrizes de voz ("Sunny + Confident", você/a gente, imperativos curtos, regra de emoji, casing, exemplos on/off-brand, lista de "evitar") | 🟡 | `docs/design-system/README.md` (seção *Content fundamentals*) | Está **em inglês**, dentro de um README técnico, com "substitution flags" (dúvidas não resolvidas). Nada específico pra social/ads: ganchos, CTAs por canal, hashtags, limites de caracteres, idioma ES |
| Personas (Carolina família · Lucas casal · Felipe grupo de amigos) com motivações, objeções e "o que converte" | 🟡 | `design/research/01-fase1-personas.html` | Conteúdo ótimo pra pauta, mas **ainda cita Maragogi** e precisa validação com dados do banco |
| Pesquisa visual fase 2 (paleta azul/sunset, Fraunces + Inter) | 🔴 obsoleto | `design/research/02-fase2-sistema-visual.html` | Paleta antiga, **contradiz o brand guide**. Risco real de um agente ler isso e errar. Marcar como histórico |
| Copy em produção (hero "A história, sua.", "Decida em 1 minuto… sem letras miúdas", 3 pilares, 3 passos, roteiro das paradas, taxa de píer) | ✅ | `src/components/*`, `src/app/passeio-escuna`, `sobre-nos` | Melhor amostra viva da voz. Base pros exemplos do guia |
| FAQ (6 perguntas) | ✅ | `src/lib/faq-data.ts` | Responde objeções (chuva, crianças, pagamento, cancelamento) — vira carrossel/story direto |
| Blog: 7 posts publicados em 5 categorias (Roteiro, Curiosidades, História, Ecoturismo, Aventura) | ✅ | `/blog`, tabela `blog_posts` | Ganchos prontos: Ilha Feia 520 mi de anos, Praia dos Ossos, Azeda 236 degraus, tartarugas, João Fernandes × Fernandinho |
| 9 templates de e-mail com a voz aplicada | ✅ | `src/lib/email-templates/` | Referência de tom em contexto transacional |
| Fatos de produto | ✅ | `CLAUDE.md`, `site-jsonld.ts` | Escuna R$ 60/pax, 2h30, 120 lugares, sáb/dom 09:30+12:00, seg–sex 11:30, 12 praias + 3 ilhas, 3 paradas de ~20 min; lancha 3h a partir de R$ 1.200 (fecha no WhatsApp); loja Travessa dos Pescadores 326 |

## 3. Fotos e vídeo

| Item | Estado | Observação |
|---|---|---|
| Fotos versionadas no site | ✅ | 45 fotos reais (~14 MB) em `public/images/photos/` — aerea 4 · buzios 1 · clientes 10 · drinks-bordo 5 · equipe 2 · escuna 5 · ilhas 6 · misc 1. Fallback das galerias |
| Biblioteca Supabase `site-images` (bucket público) | 🟡 | **1.102 objetos, ~197 MB** (1.033 webp + 69 jpeg). Pastas: fotos-passeio 279 · clientes 240 · ilhas 138 · equipe 136 · escuna 88 · aerea 82 · fotos 53 · drinks-bordo 40 · buzios 22 · misc 22 · drone-joao-fernandes 2 |
| Tagging da biblioteca | 🔴 | Só **29 de 1.102 fotos** têm tag (e só tags de galeria: `galeria-escuna` 15, `galeria-locacao` 14, `galeria-home` 12, `galeria-lancha` 2, `lancha` 2). Sem alt, sem assunto, sem orientação, sem "tem rosto de cliente?" |
| Fotos de lancha privativa **no site** | 🔴 | Apenas **2 fotos reais** no bucket. Mas ver linha abaixo |
| **Banco bruto no Drive (nunca entrou no site)** | 🟡 | `Estrela/lancha estrela/`: ensaio de **abr/2025** com ~55 fotos de câmera (DSC05xxx, 15–20 MB cada) + ~30 clipes 4K de mar/2025 (C1637–C1667, 70 MB a 1,1 GB cada). `Estrela/estrela 2025 Dimi/`: pastas `reel 1`, `reel 2`, `videos passeio`, `videos Bebiba e comida`, `drone joao fernandes`, `drone porto veleiro`, `fotos passeio`. `Escuna/Banco de IMG_VID Escuna/`: `DRONE PIER`, `Ilha feia Drone`, `João Fernandes Drone`, `tartaruga drone`, `videos celular barco`, `fotos Barco`. **A matéria-prima existe; está crua e fora do pipeline** |
| Vídeo no repo/bucket | 🔴 | Zero. Os vídeos antigos `ESCUNA ESTRELA HD.mp4` (310 MB) e `ESCUNA ESTRELA SOCIAL MEDIA.mp4` (52 MB) são de **2020**; `NAUTI TOUR.mp4` é de dez/2023. Nenhum vertical pronto |
| Direito de imagem dos clientes | 🔴 | ~250 fotos com clientes identificáveis. Pra **ads pagos** precisa de autorização de uso de imagem (LGPD + boas práticas Meta). Hoje não há registro de consentimento por foto |
| **Impressos Escuna Estrela 2024** (folhetos frente/verso retrato + paisagem, A4, City Tours; PSDs editáveis) | ✅ | No Drive (`Impresso/`). **É a identidade dos criativos**: kraft + mar petróleo + polaroids rasgadas + mapa + co-branding Nautitour/Escuna Estrela. Sistema extraído em `01-sistema-visual-impressos.md`. Elementos ainda presos nos PSDs (ver seção 8 daquele doc) |

## 4. Canais, dados e ferramentas disponíveis

| Item | Estado | Observação |
|---|---|---|
| Google Ads conta "Escuna" `4882012999` | ✅ | Skill dedicada em `.claude/skills/google-ads-expert-escuna/` + doc de medição `docs/ads-medicao-google-ads.md`. Regras duras do dono: nunca deletar, mudar só com aprovação por item. Adspirer com cota de 15 chamadas/mês (o servidor Adspirer **não conectou nesta sessão**) |
| Instagram **@escunaestrelaoficial** (confirmado pelo dono 09/out) | 🟡 | Conta existe e é a voz da Escuna Estrela nas redes. **Não consegui abrir daqui**: o proxy de rede desta sessão bloqueia instagram.com, então a análise dos posts depende de prints do dono. Os 3 ícones sociais do rodapé do site seguem apontando pra `href="#"` — ligar pelo menos o Instagram é um fix de 1 linha. Meta Ads: nenhuma conta vista |
| Conversão WhatsApp rastreável | ✅ | `/api/wa?s=<source>` registra em `whatsapp_clicks` (391 cliques até hoje, com `source`). Dá pra criar um `source` por criativo/campanha sem código novo |
| Dados de demanda | ✅ | Últimos 90 dias: 19 reservas pagas online, 2,8 pax médio. Base pequena — a maior parte do funil fecha no WhatsApp/loja, o que reforça criativos com CTA de WhatsApp |
| Analytics | ✅ | GA4 + Microsoft Clarity (gated por consent), Enhanced Conversions na Compra |
| Admin de imagens | ✅ | `/admin/imagens` com upload, otimização WebP e tags livres — já é a UI certa pra curadoria |
| Blog admin com editor | ✅ | `/admin/blog` — reaproveitável como "fonte de pauta" |
| Protótipos de post | 🟡 | `docs/design-system/templates/Templates.jsx` tem `InstagramPost` (1:1) e `InstagramStory` (9:16) em JSX de canvas, com foto placeholder. Nunca virou pipeline de export |
| Ferramentas conectadas nesta sessão | ✅ | Higgsfield (Ads Studio vazio, 671 créditos, plano Plus) · Adobe Express/Firefly MCP · Google Drive · Notion (só briefings operacionais, nada de marketing) · Supabase · Vercel |

---

## 5. Diagnóstico — onde está o gargalo

0. **Duas marcas sem ponte.** O criativo é Escuna Estrela (verde-água, estrela-do-mar) e o destino é o site Nautitour (charcoal, vermelho, timão). Quem clica no anúncio não reconhece onde caiu. Nenhum documento do repo sequer cita a Escuna Estrela.
1. **Não falta marca, falta uma fonte única legível por agente.** A voz e os tokens existem, mas espalhados em 4 lugares (README em inglês, PNGs, HTML de pesquisa com dados obsoletos, código). Um agente hoje teria 50% de chance de puxar a paleta azul errada ou escrever "Maragogi".
2. **Não há camada de "regras pra social/ads".** O guia atual é pra UI de site. Falta: pilares de conteúdo, formatos e proporções, safe areas, uso de logo sobre foto, CTA por destino (site × WhatsApp), hashtags, limites de texto por plataforma, política de emoji expandida, idioma ES.
3. **A biblioteca de 1.100 fotos é o maior ativo e está inutilizável por máquina.** Sem metadata, um agente não consegue escolher "foto horizontal de casal na proa, sem logo de terceiro, com consentimento".
4. **Zero template renderizável.** Sem logo em SVG e sem templates HTML/PNG, não existe "molde" onde o agente encaixa foto + headline.
5. **A matéria-prima de lancha e vídeo existe, mas está crua no Drive.** ~55 fotos e ~30 clipes 4K de 2025 nunca foram selecionados, tratados nem subidos. O site mostra 2 fotos de lancha e nenhum vídeo. O gargalo é curadoria e edição, não captação.

---

## 6. Opções de ataque — rankeadas

### 1º — Brand Kit para agentes (`docs/brand/`) — **recomendado começar aqui**
Consolidar em PT-BR, num só lugar e em markdown, **com a Escuna Estrela como marca dos criativos e a Nautitour como assinatura**: `brand-architecture.md` (quem é quem, quando usar cada logo, regra de co-branding), logo da Escuna Estrela convertida pra SVG a partir do CDR/PDF e versionada, `brand-voice.md` (tom, do/don't, exemplos por formato e por persona), `visual-rules-social.md` (formatos 1:1 · 4:5 · 9:16 · 1200×628, grid, safe areas, logo sobre foto, tipografia por tamanho, cores permitidas sobre imagem), `content-pillars.md` (pilares + personas corrigidas pra Búzios + calendário sazonal), `product-facts.md` (preços, horários, roteiro — fonte única), `photo-taxonomy.md` (vocabulário de tags). Marcar `design/research/02-*` como obsoleto.
- **Prós**: destrava todas as outras opções; só documentação (1 PR, sem risco); vira o "system prompt" de qualquer agente; corrige as contradições hoje.
- **Contras**: não produz nenhum criativo ainda; exige 3–4 decisões do dono (seção 7).

### 2º — Templates de criativo em HTML renderizáveis para PNG
Reproduzir o sistema dos impressos (kraft, mar petróleo, polaroids rasgadas, mapa, co-branding — ver `01-sistema-visual-impressos.md`) em 4–6 templates HTML com tokens próprios da Escuna Estrela, renderizados via Playwright (já pré-instalado no ambiente) ou Satori. Entrada: `{foto, headline, sub, cta, destino}`; saída: PNG. Isso é o "molde" que o agente designer preenche.
- **Prós**: determinístico e 100% on-brand porque usa os mesmos tokens do site; versionado no repo; barato de gerar em lote (dezenas de variações por minuto).
- **Contras**: depende do logo SVG; mais código que a opção 1; precisa de alguém validar visualmente os primeiros outputs.

### 3º — Curadoria da biblioteca de fotos com agente de visão
Rodar um agente sobre as 1.102 fotos gravando em `site_image_tags`: produto (escuna/lancha/locação), assunto (drone, ilha, bar, clientes, equipe), orientação, "rosto identificável sim/não", qualidade, horário do dia. Acrescentar coluna/tag de **consentimento de imagem** pra liberar uso em ads.
- **Prós**: transforma o maior ativo em algo pesquisável; reaproveita a UI de `/admin/imagens`; a seleção de foto do criativo vira automática.
- **Contras**: custo de inferência de visão em ~1.100 imagens; a parte de consentimento é decisão jurídica/operacional do dono, não técnica.

### 4º — Pipeline externo (Higgsfield Ads Studio / Adobe Express)
Cadastrar a marca no Higgsfield Ads Studio (ou importar HTML no Adobe Express) e gerar variações por lá.
- **Prós**: resultado visual rápido pra testar ganchos; vídeo e motion sem produção própria; já há 671 créditos disponíveis.
- **Contras**: menos controle de marca (gera "cara de IA" se não tiver o brand kit da opção 1 pronto); custo por geração; fica fora do repo. Faz sentido como **complemento** depois de 1 e 2, principalmente pra vídeo da lancha.

### Fora do ranking, mas obrigatório em paralelo
Curadoria do banco bruto do Drive: selecionar as melhores das ~55 fotos de lancha de 2025, tratar e subir pro bucket com tag `lancha`; cortar 3–5 verticais de 15–30 s dos ~30 clipes 4K (Higgsfield/Adobe ou editor humano). Captação nova só se o ensaio de 2025 não servir.

---

## 7. Decisões que só o dono pode tomar

1. **Quais redes existem**: Instagram é @escunaestrelaoficial (respondido). Falta: Facebook/TikTok existem? Quem publica hoje? Há conta de Meta Ads e pixel instalado?
2. **Uso de imagem de clientes em anúncio pago**: adotar termo de autorização no embarque/voucher, ou restringir ads a fotos sem rosto identificável e drone?
3. **Destino padrão do CTA por produto**: escuna → checkout online; lancha/locação → WhatsApp (já é a regra do site). Confirmar se vale também pra ads.
4. **Idioma**: só PT-BR ou também ES (público argentino) desde o início?
5. **Ponte entre as marcas**: (a) site ganha a Escuna Estrela na página do passeio e no rodapé ("Escuna Estrela by Nautitour"), (b) criativos ganham assinatura Nautitour discreta, ou (c) os dois. Recomendo (c): custa pouco e resolve o reconhecimento nos dois sentidos.
6. Orçamento mensal pra ferramentas de geração (Higgsfield/Adobe) e pra mídia Meta.

---

## 8. Esboço da automação com agentes (alvo após opções 1–3)

```
[Estrategista]  lê content-pillars + personas + dados (reservas, cliques WA, Ads)
      ↓          → pauta semanal: N posts × formato × produto × persona × CTA
[Copywriter]    lê brand-voice + product-facts → headline/sub/legenda/hashtags/CTA (PT, ES opcional) — assina como Escuna Estrela
      ↓
[Designer]      escolhe fotos por tag (consentimento=ok) → preenche template HTML → PNG/MP4
      ↓
[Revisor]       checklist de marca (cores, logo, tom, fatos corretos, limites de texto, LGPD)
      ↓
[Humano aprova] fila em /admin (ou Notion) com preview
      ↓
[Publicador]    agenda no Meta / cria anúncio (Adspirer, com aprovação por item) · link com /api/wa?s=<criativo> ou UTM
      ↓
[Analista]      lê cliques WA por source + conversões → realimenta o Estrategista
```

Tudo que o agente precisa "saber" vem dos arquivos de `docs/brand/` (opção 1); tudo que ele "monta" vem dos templates (opção 2) e da biblioteca tagueada (opção 3). Sem essas três camadas, a automação produz volume, não marca.
