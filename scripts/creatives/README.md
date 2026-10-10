# Criativos — moldes HTML → PNG

Gera criativos da Escuna Estrela a partir de um spec JSON e de moldes HTML, no sistema visual
dos impressos (`docs/brand/sistema-visual-social.md`). Nada daqui entra no build do site.

## Uso

```bash
node scripts/creatives/render.mjs scripts/creatives/specs/exemplo-molde-a.json --out out/criativos
```

Requer Playwright com Chromium. Local: `npm i -D playwright && npx playwright install chromium`
(o script também acha o Playwright instalado globalmente). Fonte Poppins vem do Google Fonts na hora
de renderizar, então precisa de rede.

## Spec

```json
{
  "nome": "escuna-sabado",
  "molde": "A",
  "formatos": ["4x5", "1x1", "9x16", "1200x628"],
  "foto_hero": "public/images/photos/escuna/escuna-pier-01.jpg",
  "heroPos": "50% 55%",
  "titulo": "Sáb e dom, 9h30 e 12h.",
  "fato": "12 praias, 3 ilhas, 2h30. R$ 60 por pessoa.",
  "cta": { "texto": "Reserve pelo link", "tipo": "site", "destino": "https://nautitour.com.br/passeio-escuna?utm_..." },
  "assinatura": "escuna",
  "seed": 7
}
```

| Campo | Valores |
|---|---|
| `molde` | `HF` (**fluxo principal**, decisão 09/out): arte base SEM texto gerada no Higgsfield a partir dos posts reais + nossas fotos (`bases/`, prompts em `prompts/`), e título/fato/CTA/logo desenhados por cima em HTML nas `zonas` do spec. `A` (foto + faixa 100% em HTML/CSS) fica como fallback sem custo |
| `arte_base` | (molde HF) caminho da arte base JPEG/PNG já no formato final |
| `polaroides` | (molde HF) lista de `{foto, x, y, w, prop:"4 / 5", girar, legenda, tamanho, fotoPos}` em % da arte: o molde desenha a polaroide (borda branca rasgada + legenda na borda) sobre a arte base. Usar com os fundos `fundo-*.jpg` |
| `zonas` | (molde HF) caixas em % da arte: `texto {x,y,w,h,alinhar:'centro'|'esquerda',titulo,fato,cta}` (tamanhos em % da largura) e `logo {x,y,w,h}` |
| `formatos` | `4x5` 1080×1350 · `1x1` 1080×1080 · `9x16` 1080×1920 (área segura de 250 px) · `1200x628` anúncio paisagem |
| `foto_hero` | caminho relativo à raiz do repo (ou absoluto) |
| `heroPos` | `object-position` da foto, opcional |
| `titulo` | até 5 palavras (regra do brand kit) |
| `fato` | uma linha, opcional |
| `cta.tipo` | `site` (cartão branco) ou `whatsapp` (cartão com ícone e texto verde). `destino` fica no spec pra legenda e rastreio; não é desenhado |
| `assinatura` | `escuna` (feed orgânico) ou `escuna+nautitour` (anúncio pago) |
| `seed` | inteiro; mesmo seed = mesmo rasgo |

## Fluxo Higgsfield → HTML (molde HF)

1. Referências sobem pro Higgsfield por URL pública (raw do GitHub: `docs/social/refs/post-N.jpg`, fotos em `public/images/photos/`) — o upload direto daqui é bloqueado pelo proxy, então o PUT roda no sandbox do Higgsfield.
2. `generate_image` com `gpt_image_2_5` + referências (2 posts reais + fotos) e o prompt de `prompts/` pedindo arte **sem texto** com as áreas do título e da logo vazias.
3. A arte volta como JPEG 1080 px (via `sandbox_exec` + `image_paths`, limite 512 KB por chamada) e vai pra `bases/`.
4. `node scripts/creatives/render.mjs specs/<spec>.json` desenha texto, CTA e logo por cima.

Comparação feita em 09/out: Higgsfield gerando o post inteiro (com texto) acerta o texto na maioria das vezes mas pode redesenhar a logo e trocar fotos; por isso texto e logo ficam no HTML.

## Elementos

Kraft, rasgo, marca d'água de rosa dos ventos e rosa de madeira são **reconstruídos em CSS/SVG** porque os
originais ainda estão presos nos PSDs. O rasgo é um papel branco (`#paperPath`) rasgado alguns px pra fora do mar
(`#seaPath`), com fibras por `feDisplacementMap`; o mesmo `seed` gera o mesmo rasgo. Quando os elementos forem
exportados (lista em `docs/brand/sistema-visual-social.md`), trocar no molde: textura em `.kraft::before/::after`,
máscara em `#seaPath`/`#paperPath`, rosa em `.wood` (hoje uma estrela de 8 pontas desenhada; o PNG de madeira do PSD
entra no lugar com a mesma posição: 44% da largura, canto inferior direito, 14° de giro). Logos vetoriais já estão em `public/brand/escuna-estrela/` e `public/brand/nautitour-horizontal-*.svg`.

Pra ver um molde sem renderizar: abrir `templates/molde-a.html` no navegador (usa um spec de exemplo embutido, sem foto).
