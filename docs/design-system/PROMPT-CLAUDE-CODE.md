# Prompt para Claude Code — Integrar templates Nautitour ao repositório

Cole este prompt no Claude Code, dentro do repositório clonado.

---

## Contexto
Você vai integrar o pacote de design (`./export-claude-code/`) ao repositório atual da **Nautitour Passeios**. O pacote contém:

- `colors_and_type.css` — design tokens (cores, tipografia, sombras, raios)
- `assets/` — logos, ícones e ~40 fotos curadas em 8 categorias
- `templates/` — 9 páginas web completas (React/JSX) + 3 templates compositivos + variações mobile/social
- `templates/index.html` — design canvas que renderiza tudo lado-a-lado

As páginas web institucionais entregues:
1. Detalhe do passeio (Tour das Ilhas) — galeria, sticky booking card, timeline, mapa
2. Lancha Privativa — visual editorial premium
3. Como Funciona — passo a passo em zigzag
4. Sobre / História — hero editorial + timeline + equipe
5. Galeria — masonry com filtros
6. FAQ — acordeão agrupado
7. Contato — mapa com pin + form
8. Confirmação pós-reserva — voucher com QR
9. Avaliações — 4.9 ★ com distribuição

## Sua missão (em 4 fases — pare entre cada uma)

### Fase 1 — Inventário do repo
1. Detecte o stack (Next.js? Vite + React? Astro? HTML estático? WordPress?)
2. Mapeie a estrutura de rotas/páginas existentes
3. Identifique onde ficam os componentes compartilhados, estilos globais, assets
4. Veja se já existe algum design system / tokens em uso (Tailwind config, CSS vars, theme file)
5. Me devolva um resumo: stack, rotas atuais, conflitos potenciais com o pacote. **Pare e espere "ok".**

### Fase 2 — Plano de integração
Proponha (em texto, sem aplicar ainda):
1. **Tokens** — onde injetar `colors_and_type.css` (raiz, layout root, ou converter para Tailwind theme/`globals.css`?)
2. **Assets** — pra onde mover `assets/` (`public/`, `src/assets/`, CDN?)
3. **Componentes** — como dividir `Components.jsx` + `WebChrome.jsx` em arquivos individuais idiomáticos do stack (TopNav, Footer, Page, Eyebrow, etc.)
4. **Páginas** — como mapear cada `<Page>` JSX pra rota do framework (`/passeios/tour-das-ilhas`, `/lancha-privativa`, `/como-funciona`, `/sobre`, `/galeria`, `/faq`, `/contato`, `/confirmacao/[id]`, `/avaliacoes`)
5. **Substituições** — listar dependências do template (uso de `var(--...)`, paths de imagem absolutos, fonts via CSS) e como adaptar pro stack
6. **O que NÃO migrar** — o `design-canvas.jsx` é só pra preview no design tool, NÃO entra no produto final. Ignore.

**Pare e espere "ok".**

### Fase 3 — Aplicação
Depois da minha confirmação:
1. Mova os tokens, assets, componentes pros caminhos certos
2. Converta cada `<Page>` JSX em uma rota real, mantendo a marcação **fiel** (não "melhore" o design — replicar 1:1)
3. Substitua paths de imagem por imports estáticos do framework quando for o caso
4. Configure as fontes (Fraunces e Inter) via Google Fonts ou self-host
5. Crie um arquivo `INTEGRATION.md` documentando o que foi mexido
6. Não apague nada do repo original — se houver conflito, renomeie pra `*.legacy.tsx`

### Fase 4 — Polish
1. Garanta tipagem TypeScript se o repo usar TS (converta JSX → TSX)
2. Quebre componentes >300 linhas em arquivos menores
3. Garanta que cada página passa em build sem warnings
4. Liste todos os textos PT-BR que vão pro CMS futuramente (se aplicável)
5. Me devolva: rotas funcionando, screenshots das páginas em dev, próximos passos

## Regras
- **Replicar fielmente** o visual entregue. Não redesenhe.
- **Tokens são lei**: nunca use cores ou fontes fora de `colors_and_type.css`.
- **Fotos com transparência ou crop**: deixe os comportamentos de `background-image: cover/center` intactos.
- **Mobile-first**: cada página foi desenhada em 1280px, mas estruture os componentes pra serem responsivos com breakpoints sensatos (≤768 stack vertical, ≤1024 ajusta grid).
- **Performance**: imagens via `<Image>` nativo do framework quando possível, lazy + width/height definidos.
- **Acessibilidade**: alt em toda imagem, role/aria nos elementos interativos do form e voucher.

Quando terminar a Fase 1, mande o relatório.
