# Sistema visual para social e anúncios

Resumo operacional do sistema dos impressos (`docs/social/01-sistema-visual-impressos.md`) aplicado aos
formatos de social, com os 5 moldes extraídos dos posts reais (`docs/social/02-posts-referencia.md`).

## Tokens

| Token | Valor | Uso |
|---|---|---|
| `--ee-petroleo` | `#075A5E` | Base do bloco de mar, título sobre kraft, ícones, texto do corpo |
| `--ee-petroleo-escuro` | `#072A2E` | Topo do degradê, sombras |
| `--ee-turquesa` | `#09959C` | Ponta clara do degradê, subtítulo, pins, rota do mapa |
| `--ee-turquesa-clara` | `#5FB3B8` | Sub em cima do petróleo ("Passe para o lado") |
| `--ee-kraft` | `#E7E5DD` | Fundo de papel |
| `--ee-kraft-escuro` | `#D0C9B8` | Grão do papel, terra do mapa |
| `--ee-offwhite` | `#E9E6DF` | Título sobre o mar. Nunca `#FFFFFF` puro |
| `--ee-estrela` | `#20C098` | Só a logo |
| `--nt-vermelho` | `#C00010` | Só a logo Nautitour |
| Degradê do mar | `linear-gradient(160deg, #072A2E 0%, #075A5E 45%, #09959C 100%)` | Bloco de título |
| Fonte | **Poppins** 700 (título), 600 (sub), 500 (corpo). Fallback Montserrat | Google Fonts. Confirmar no PSD |
| Rotação das polaroids | −6° a +6° | Nunca duas com o mesmo ângulo |

## Elementos fixos (estão em toda peça)

1. Papel kraft com grão visível.
2. Bloco de mar em degradê, separado do kraft por um **rasgo** irregular com sombra.
3. Marca d'água de rosa dos ventos em traço fino, 8 a 12% de opacidade, grande, sangrando pela borda.
4. Rosa dos ventos de madeira entrando por um canto, metade pra fora.
5. Polaroids com os 4 lados rasgados, sombra suave.
6. Logo Escuna Estrela no rodapé (sozinha no orgânico; com a Nautitour no pago).

Opcionais por molde: folha desfocada no canto, mapa do roteiro, ícones petróleo (palmeira, barco, drinks, check), cartão branco de CTA.

## Os 5 moldes

| Molde | Estrutura | Para quê | Formatos |
|---|---|---|---|
| **A · Foto + faixa** | Foto hero 60–70% no topo → rasgo → faixa petróleo com título (e fato) → tira kraft com logo e CTA | Anúncio, urgência, saída do dia | 4:5, 1:1, 9:16, 1200×628 |
| **B · Foto + coluna** | Foto hero à esquerda, 4–5 polaroids empilhadas à direita, título sobre a foto com degradê escuro embaixo | Prova social, "o que você vai viver" | 4:5, 9:16 |
| **C · Mar em cima** | Petróleo no terço superior com título, kraft embaixo com 2–3 polaroids em leque, logo centralizada | Inspiração, capa de carrossel | 4:5, 1:1 |
| **D · Pergunta** | Pergunta no petróleo, 3 polaroids rotuladas no kraft | Enquete, engajamento | 1:1, 4:5 |
| **E · Polaroid única** | Petróleo inteiro, uma polaroid grande com legenda-pergunta em turquesa | Curiosidade, educativo curto, story | 4:5, 9:16 |

## Medidas por formato

| Formato | Pixels | Área segura | Observação |
|---|---|---|---|
| Feed 4:5 | 1080×1350 | 60 px nas bordas | Formato padrão do feed |
| Feed 1:1 | 1080×1080 | 60 px | Molde D e C |
| Story / Reel | 1080×1920 | **250 px no topo e no rodapé**, 60 px nos lados | Nada de texto ou logo nas faixas de UI do Instagram |
| Anúncio paisagem | 1200×628 | 40 px | Versão paisagem do molde A, logos no canto |
| Carrossel | 1080×1350 por card | 60 px | Capa = molde C; cards = molde E; último = CTA |

Título: 72 a 96 px no 4:5; 96 a 120 px no story. Corpo nunca abaixo de 36 px. Logo entre 180 e 240 px de largura no 4:5.

## Campos variáveis (o que o agente preenche)

```
foto_hero        caminho no bucket, horizontal para A/B/C, qualquer para E
polaroids[]      1 a 5 caminhos
titulo           até 5 palavras
fato             1 linha, opcional
cta              texto + destino (link com UTM ou /api/wa?s=<id>)
molde            A | B | C | D | E
formato          4x5 | 1x1 | 9x16 | 1200x628
assinatura       escuna | escuna+nautitour
```

## Regras de foto

- Sol alto, água visível, gente de verdade em ação. Nada de banco de imagem.
- Molde A e B: a foto hero mostra o barco inteiro ou a água com gente.
- Polaroids: variar assunto (barco, ilha, drink, pessoas, drone). Nunca 3 drones iguais.
- Rosto identificável em anúncio pago só com a tag `consentimento-ok` (a empresa colhe autorização; ver `taxonomia-de-fotos.md`).
- Foto de lancha nos moldes A e E; a coluna do molde B é a melhor pra mostrar "o dia inteiro" da lancha.

## O que não fazer

Fundo branco liso · foto com canto reto ou moldura reta · título em verde-estrela, vermelho ou preto ·
mais de 2 logos · fonte serifada · emoji na arte · degradê colorido genérico · texto nas faixas de UI do story ·
preço ou horário que não esteja em `fatos-do-produto.md`.

## Elementos que ainda faltam exportar dos PSDs

Textura kraft em tile · máscaras de rasgo (borda e moldura) · rosa dos ventos em traço e em madeira (PNG transparente) ·
folhas desfocadas · mapa de Búzios com rota (SVG) · ícones palmeira/barco/drinks/check (SVG) · as duas logos em SVG · confirmar a fonte.
Enquanto não chegam, os moldes HTML reconstroem kraft, rasgo e marca d'água em CSS/SVG; a troca pelos originais é só substituir arquivo.
