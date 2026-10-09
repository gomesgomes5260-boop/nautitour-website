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
  "foto_hero": "public/images/photos/clientes/pulo-bordo-01.jpg",
  "heroPos": "50% 40%",
  "titulo": "Sáb e dom, 9h30 e 12h.",
  "fato": "12 praias, 3 ilhas, 2h30. R$ 60 por pessoa.",
  "cta": { "texto": "Reserve pelo link", "tipo": "site", "destino": "https://nautitour.com.br/passeio-escuna?utm_..." },
  "assinatura": "escuna",
  "seed": 7
}
```

| Campo | Valores |
|---|---|
| `molde` | `A` (foto + faixa). B a E entram nas próximas PRs |
| `formatos` | `4x5` 1080×1350 · `1x1` 1080×1080 · `9x16` 1080×1920 (área segura de 250 px) · `1200x628` anúncio paisagem |
| `foto_hero` | caminho relativo à raiz do repo (ou absoluto) |
| `heroPos` | `object-position` da foto, opcional |
| `titulo` | até 5 palavras (regra do brand kit) |
| `fato` | uma linha, opcional |
| `cta.tipo` | `site` (cartão branco) ou `whatsapp` (cartão com ícone e texto verde). `destino` fica no spec pra legenda e rastreio; não é desenhado |
| `assinatura` | `escuna` (feed orgânico) ou `escuna+nautitour` (anúncio pago) |
| `seed` | inteiro; mesmo seed = mesmo rasgo |

## Elementos

Kraft, rasgo, marca d'água de rosa dos ventos e rosa de madeira são **reconstruídos em CSS/SVG** porque os
originais ainda estão presos nos PSDs. Quando os elementos forem exportados (lista em
`docs/brand/sistema-visual-social.md`), trocar no molde: textura em `.kraft::after`, máscara em `#seaPath`,
rosa em `.wood`. Logos vetoriais já estão em `public/brand/escuna-estrela/` e `public/brand/nautitour-horizontal-*.svg`.

Pra ver um molde sem renderizar: abrir `templates/molde-a.html` no navegador (usa um spec de exemplo embutido, sem foto).
