# Brand Guide — Nautitour (oficial)

PNGs do brand guide enviados pelo cliente em `NautitourWEB.zip`. Esta é a **referência canônica** — quando houver discordância entre código e estas imagens, as imagens vencem.

## Estrutura

```
brand-guide/
├── brand/            ← logomark + logomockup (charcoal mono, white mono, knockout)
├── colors/           ← brandcolors, colorscales, gradiants, semanticcolors
├── components/       ← buttons, badges, tourcards, formfields, stepcardrow
├── spacing/          ← spacingscale, cornerradio, elevationscale
└── type/             ← displaytype (Fraunces), bodytype (Montserrat), numerics
```

## Resumo dos tokens (canonical)

### Brand colors
- **Primary**: Charcoal `#404040`
- **Accent**: Red `#C00010`
- **Secondary**: Gray `#808080`
- **Surface**: White `#FFFFFF`

### Color scales
- **Charcoal**: 50, 100, 200, 300, 400, 500, **700★** (`#404040`), 900
- **Red**: 50, 100, 300, 500, **600★** (`#C00010`), 700, 900
- **Sea** (overlays fotográficos só): 300, 500, 700 (`#6FB3C9` / `#2F7E96` / `#16526B`)

★ = sampleado direto da logo oficial.

### Gradientes
- `--gradient-flag` — `#C00010 → #6E0000` (red)
- `--gradient-iron` — `#404040 → #1F1F1F` (charcoal)
- `--gradient-mare` — `#6FB3C9 → #2F7E96` (sea, overlay only)

### Tipografia
- **Display**: Fraunces (serif, opsz variável 9-144, peso 400-900)
- **Body**: Montserrat (sans, 400-900 — heavy 900 pra wordmark)
- **Mono**: JetBrains Mono (códigos de reserva, recibos)

### Wordmark
"NAUTI" em charcoal-700 + "TOUR" em red-600 · Montserrat heavy · letter-spacing leve.

### Espaçamento (4px base)
`space-1`=4 · `space-2`=8 · `space-3`=12 · `space-4`=16 · `space-5`=24 · `space-6`=32 · `space-7`=48 · `space-8`=64 · `space-9`=96

### Border radius
`sm`=4 · `md`=8 · `lg`=16 · `xl`=28 · `pill`=999

### Elevation
3 níveis (`--shadow-1`, `--shadow-2`, `--shadow-3`) — base `rgb(31 31 31 / x)` (warm-dark).

## Onde está aplicado

- **Tokens CSS**: `src/app/globals.css` (`@theme` block)
- **Fontes**: `src/app/layout.tsx` (`next/font/google`)
- **Logo**: `public/brand/logomark.png` (servido como asset estático)
- **Componentes**: migração gradual em PRs Rebrand-2, Rebrand-3...

## Preview renderizado

`design/research/03-brand-guide-applied.html` ou (após deploy) `https://nautitour-website.vercel.app/_design/03-brand-guide-applied.html`
