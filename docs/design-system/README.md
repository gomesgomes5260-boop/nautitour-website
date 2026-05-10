# Nautitour Passeios — Design System

> *"Reserve em 1 minuto. Embarque com a gente."*
> Branding & UI guidelines for Nautitour Passeios — boat tours, schooners, and private speedboat charters in Búzios, Brazil.

---

## What is Nautitour?

**Nautitour Passeios LTDA** (CNPJ 43.254.610/0001-24) is a tour-and-travel agency founded in **August 2021** in **Armação dos Búzios, Rio de Janeiro**. They operate the most-booked schooner ride in Búzios plus a fleet of private speedboats, threading the famous **12 beaches and 3 islands** of the Região dos Lagos coast.

Two flagship products:

| Product | What | Audience | Tone |
|---|---|---|---|
| **Passeio de Escuna** | Shared schooner ride, ~R$60/person, 12-beach roteiro, music, swim stops, on-board bar | Couples, families, friend groups | Warm, lively, "festa no barco" |
| **Lancha Privativa** | Private speedboat charter, R$1.200+ for 3h, custom roteiro | Couples, small groups wanting privacy | Calmer, exclusive, "só vocês e o mar" |

A currency-exchange counter operates from the same shop on Travessa dos Pescadores 326, Centro de Búzios.

**Voice the user asked for: "funny and professional"** — confident, warm, with a wink. Like a Brazilian crew member who's done this 1,000 times and is genuinely glad you're here.

---

## Sources used to build this system

1. **Logo file** — `uploads/logo_file-1777852268815.pdf` (the .ai master converted to PDF, 5 pages: full-color, white-on-charcoal, white-on-red, charcoal-mono, vertical lockup). The brand colors here were **sampled directly from this artwork.**
2. **Live website** — https://nautitour.com.br (page copy, layout sense, illustration style).
3. **Brazilian business registries** (cnpj.biz, diariocidade.com.br) for company facts.
4. **Tripadvisor / Google reviews** sampled in search results for tone.
5. **The user's brief**: *"warm design vibrant patterns, our voice is funny and professional."*

---

## Index

```
README.md                   ← you are here
SKILL.md                    ← agent-skills entrypoint (Claude Code compatible)
colors_and_type.css         ← all CSS custom properties (primitives + semantic)
assets/
  logo-fullcolor.png        ← primary logo on white (sampled from .ai)
  logo-white.png            ← knockout — for charcoal & red surfaces
  logo-mono-charcoal.png    ← single-color charcoal mono
  patterns/                 ← onda · listras · constelação · sol  (currentColor SVGs)
  icons/spot/               ← spot illustrations: wheel · boat · anchor · cocktail · sun · island
preview/                    ← cards rendered into the Design System tab
ui_kits/
  marketing-site/           ← React JSX recreation of the website
    index.html              ← interactive home page (hero, tours, how-it-works, FAQ)
    Components.jsx          ← TopNav, Hero, TourCard, StepCard, Quote, Footer
uploads/
  logo_file-…pdf            ← original .ai-derived PDF the user uploaded
```

---

## Content fundamentals

### Voice in two adjectives
**Sunny + Confident.** Brazilian beach hospitality with the maturity of a captain who's done 4,000 crossings. Funny but never goofy; professional but never stiff.

### Person & address
- **"Você"** (informal you), never "o senhor / a senhora." Beach business — formality breaks the spell.
- **"Nós" / "a gente"** for the company. The crew is part of the experience.
- **Short imperatives** for CTAs: *"Reserve agora", "Embarque com a gente", "Ver datas"*.

### Sentence shape
- **Promise → relief → proof.**
  - *"Decida em 1 minuto: navegue pelo nosso site e escolha…"* (promise + relief)
  - *"Tudo claro e sem letras miúdas."* (proof, with humor)
- **Bold the relief.** Plain everything else.
- One sentence per beat — no piled clauses.

### Casing
- **Title Case** for product names ("Passeio de Escuna", "Lancha Privativa").
- Sentence case for body, buttons, nav.
- **ALL CAPS** only on small eyebrow labels ("MAIS PROCURADO").
- Prices use Brazilian convention: `R$60,00` (comma decimal, period thousands).

### Funny without trying
The brand earns laughs from **honesty**, not jokes:
- *"Tudo claro e sem letras miúdas."*
- *"É só chegar, apresentar o voucher no celular e começar a navegar."*
- *"Brindar à vida com a vista perfeita."*

**Avoid**: pirate-speak, "ARRR", emoji-heavy copy, exclamation stacks, "live the dream" travel-blog cliché.

### Languages
PT-BR primary. ES-AR (lots of Argentine tourists in Búzios) and EN secondary. CTAs are always 1–2 short words so they translate cleanly.

### Emoji policy
**Sparingly, nautical only.** ☀️ 🌊 ⛵ 🍹 are okay in WhatsApp / social. **No emoji in product UI, buttons, or headings.** Never in logo, never in print.

### In-voice examples

| Context | ✅ On-brand | ❌ Off-brand |
|---|---|---|
| Hero subhead | *Tenha uma experiência inesquecível com a família e amigos.* | *Live the Búzios dream with us!!!* |
| Step label | *Fácil de embarcar* | *Step 3: Boarding Process* |
| Empty cart | *Seu carrinho está vazio.* | *Oops! Looks like nothing's here yet 🥲* |
| Confirmation | *Tudo certo. Te vemos no cais às 10h.* | *Booking #847291 confirmed.* |
| Error | *Esse horário acabou de lotar. Próxima saída: 13h.* | *Error: Slot unavailable.* |

---

## Visual foundations

### Color story — sampled from the logo
The brand is **two-color and intentional**: charcoal `#404040` for everything structural (the wheel, the boat outline, "NAUTI"), and a confident vermillion `#C00010` for the boat hull, "TOUR", and every CTA. Light gray `#808080` plays the supporting role "PASSEIOS" plays in the wordmark — secondary text, captions. White is the primary surface.

| Role | Token | Hex | Use |
|---|---|---|---|
| Primary structural | `--charcoal-700` | `#404040` | Headings, top nav, secondary buttons, body copy on light |
| Primary accent | `--red-600` | `#C00010` | CTAs, prices, "TOUR" wordmark, sale badges |
| Secondary text | `--charcoal-400` | `#808080` | Meta info, captions, "PASSEIOS" wordmark |
| Surface | white `#FFFFFF` | — | Page background, cards |
| Surface alt | `--charcoal-50` | `#F4F4F4` | Subtle section bands, input rows |
| Sea (support) | `--sea-500` | `#2F7E96` | Photo overlays, secondary informational chip — used sparingly |

Two signature gradients:
- **Bandeira** — `linear-gradient(135deg, var(--red-600), var(--red-700))` — primary CTA on photographic backgrounds.
- **Ferro** — `linear-gradient(180deg, var(--charcoal-700), var(--charcoal-900))` — top nav on scroll, footer.

The third (Maré, sea-300 → sea-700) exists for the rare moments warmth doesn't fit — overlays on photographic underwater content.

### Typography
- **Display** — *Fraunces* (variable serif). Slight nostalgia, evokes vintage travel posters and ship signage. Used at 30px+. ⚠️ **Substitution**: the live website uses generic system sans; Fraunces is an opinionated choice for editorial gravitas. Swap `--font-display` if a master typeface gets adopted.
- **Body / UI** — *Montserrat*. Heavy enough at 800/900 to pick up the wordmark feeling; readable at 14–16. Matches the wordmark's geometric character. ⚠️ **Substitution flag**: we don't know the exact wordmark face from the .ai (likely a custom-tracked Montserrat-class display sans). If you have the real face, replace `--font-body`.
- **Mono** — *JetBrains Mono*. Booking codes, dates, receipts.

The **wordmark style** (`.nt-wordmark`) is a content treatment: heavy uppercase Montserrat with charcoal "NAUTI" + red "TOUR" — usable as a headline accent within long copy ("o que faz a `<NAUTI>TOUR<>` diferente").

### Patterns & textures
This is the "vibrant patterns" the user asked for. Four single-color SVG patterns ship in `assets/patterns/`, all using `currentColor` so they tint to whatever surface they sit on:

1. **Onda** — repeating wave line. Section dividers, footer top border.
2. **Listras** — diagonal red+white nautical stripes. Hero corners, "Lancha Privativa" cards, Pix / promo callouts.
3. **Constelação** — small dotted star field. Charcoal sections (e.g. footer, evening-charter callouts).
4. **Sol** — radial sunburst, 8-spoke. Hero corner anchors, empty-state heroes.

Always single-color. Never duotone, never photographic. Decorative, not functional.

### Backgrounds
- **Photography** for hero sections only. Real shots: aerial of the schooner, swimmers at João Fernandes, sunset cocktails on deck.
- **White** is the default surface (the logo is on white in its primary form — we honor that).
- **Charcoal-50** for content section bands (FAQ, "How it works").
- **Charcoal-700** for top nav and footer.

### Spacing
Eight-point system: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Section vertical rhythm 64–96; in-section gaps 16–24.

### Corner radii
- `--radius-sm` 4px (chips, inputs in tight spaces)
- `--radius-md` 8px (buttons, inputs)
- `--radius-lg` 16px (cards, modals)
- `--radius-xl` 28px (hero cards, full-bleed photo blocks)
- `--radius-pill` 999px (badges, filter chips)
- **No 0px corners.** Even hero photography clips to 16+ on at least two corners.

### Borders
Mostly invisible. When present: 1px `rgba(64,64,64,0.12)` or `0.20` — a barely-there charcoal. **No black borders ever.**

### Shadow system
Three elevations, **neutral** (the palette is cool — warm shadows would clash):
- `--shadow-1` — `0 1px 2px rgba(31,31,31,0.08)`
- `--shadow-2` — `0 6px 18px rgba(31,31,31,0.10), 0 1px 3px rgba(31,31,31,0.06)`
- `--shadow-3` — `0 24px 56px rgba(31,31,31,0.22), 0 4px 10px rgba(31,31,31,0.10)`

**No inner shadows.** Skeuomorphism is off-brand.

### Cards
White background, 16px radius, `--shadow-2`. Photo-fronted cards (tour cards) clip the photo to top with same radius; body sits on white below.

### Buttons
- **Primary** — Red `#C00010`, white text, 8px radius, 12/20 padding. Hover: red-700, translate Y -1px, shadow up one step.
- **Secondary** — Charcoal `#404040`, white text. Hover: charcoal-900.
- **Outline** — transparent, charcoal text, 1.5px charcoal border. Hover: fills charcoal, text flips white.
- **Ghost** — text only, charcoal. Hover: red-600.
- **Danger outline** — red text, red border. Hover: red-50 fill.
- **Press**: scale 0.98, shadow drops to elevation-1. 80ms.

### Animation & motion
- **Default easing**: `cubic-bezier(.2,.8,.2,1)` — quick out, soft land (a wave hitting sand).
- **Durations**: 120ms state changes, 240ms layout shifts, 480ms hero reveals.
- **Vocabulary**: subtle Y translates (-1 to -2px), gentle scale (0.98 ↔ 1.02). No rotation. No spring overshoot.
- **prefers-reduced-motion**: durations collapse to 0.

### Hover states
Default: brightness +5% AND shadow up one step. Links: underline appears. Photo cards: image scales 1.02 inside its clip; rest of card stays put.

### Press states
Scale 0.98, shadow → elevation-1, color darkens 8%. 80ms.

### Imagery vibe
**Warm, sunlit, slight grain.** Golden-hour preferred. Real customers in frame, faces visible. No staged stock. No moody B&W. Every photo reads like it was taken between 9 AM and 6 PM in Búzios.

### Transparency & blur
- Sticky-nav glass on long-scroll pages: `backdrop-filter: blur(12px)`, `background: rgba(64,64,64,0.78)`.
- Modal scrims: `rgba(31,31,31,0.55)`.
- **No frosted glass on cards.** It dates fast and clashes with the disciplined two-color palette.

### Layout rules
- Marketing pages: max content width 1200px, gutters 24/48 (mobile/desktop).
- Sticky 64px top nav. Charcoal at all times — the brand is bold enough to skip the transparent-over-hero trick.
- One full-bleed image per page above the fold.
- Footer is always charcoal-700 with the white-knockout logo.

---

## Iconography

The brand uses **a small set of single-color stroke illustrations** at marketing scale (the `wheel` motif from the logo carries through), and **Lucide** for functional UI icons.

1. **Brand spot illustrations** — `assets/icons/spot/*.svg`: wheel, boat, anchor, cocktail, sun, island. Single-color, `currentColor`, 64×64 nominal canvas, 2.5px stroke, rounded line caps. Use for marketing eyebrows and feature sections.
2. **UI icons** — **Lucide** via CDN (`https://unpkg.com/lucide@latest`). Lucide's 1.5–2px stroke + rounded caps match the warmth of the spot icons. ⚠️ **Substitution flag** — none of these icons came from the brand assets directly; they're inferred from logo style and live-site illustration vocabulary. Swap if a richer icon kit exists.
3. **No emoji** in UI.
4. **No unicode glyph icons** (✓, ★, etc.) — always SVG.
5. **Currency / payment marks** (PIX, Visa, Mastercard) use real brand SVGs from official press kits when needed.

---

## How to use this system

- For prototyping or design exploration, link `colors_and_type.css` and pull tokens via `var(--…)`. Drop in spot icons + patterns by `<img src="">`.
- For copy: write in Portuguese first; default voice = warm + confident. When in doubt, ask: *would a captain who's done 1,000 crossings say it this way?*
- For a complete reference layout, open `ui_kits/marketing-site/index.html`.
- For agent-skills compatibility (Claude Code), see `SKILL.md`.

⚠️ **Substitution flags summary** — places we made educated guesses you may want to replace:
- Wordmark face & UI body face (we picked Montserrat as the closest-feeling Google Font).
- Display face (Fraunces is opinionated).
- Spot icon set (hand-drawn here from logo motifs).
- Photography (none provided — UI kit uses `picsum.photos` placeholders).

(See `colors_and_type.css` for token definitions, `preview/` for swatch and component cards, and `ui_kits/marketing-site/` for a working clickable recreation.)
