# Blog Editorial — Referências

Pasta dedicada a referências pro redesign do blog (`/blog` + `/blog/[slug]` + editor admin).

Plano completo: `/root/.claude/plans/vamos-mudar-o-design-polymorphic-pnueli.md` (resumo abaixo).

## Direção definida

- **Vibe**: costeiro warm-lifestyle estilo **Cereal Magazine / Kinfolk / Apartamento**
- **Escopo**: listagem + página de post + componentes novos no editor admin
- **Voz**: já existente em `docs/design-system/README.md` ("sunny + confident")

## O que coletar (8–12 refs no total)

| Categoria | Quantidade | Crítico? |
|---|---|---|
| Layouts de post completos | 4+ | ✅ sim |
| Layouts de listagem | 2–3 | ✅ sim |
| Elementos editoriais isolados (pull quote, drop cap, callout, diptych, caption, ToC) | 2–3 | ✅ sim |
| Mood fotográfico costeiro | 1–2 | opcional |
| Anti-refs ("não quero ficar assim") | 0–2 | opcional |

### Onde caçar (sugestões)

- [Cereal Magazine](https://readcereal.com/) — travel diaries
- [Kinfolk](https://www.kinfolk.com/) — articles/reads
- [Apartamento](https://www.apartamentomagazine.com/)
- [Monocle Travel](https://monocle.com/film/)
- [AFAR](https://www.afar.com/magazine)
- [Suitcase Magazine](https://suitcasemag.com/)
- [Condé Nast Traveler](https://www.cntraveler.com/inspiration)
- [Piauí](https://piaui.folha.uol.com.br/) — corte brasileiro de long-form

## Como nomear arquivos

Padrão do repositório (ver `design/inspirations/README.md`):

```
{empresa}-{elemento}-{detalhe}.png

Exemplos:
cereal-magazine-post-hero.png
kinfolk-pullquote-detail.png
afar-listing-asymmetric.png
piaui-dropcap-headlinetreatment.png
```

## Como anotar (use `notes.md` ao lado)

Pra cada ref, **mais valioso do que opinião geral é apontar o detalhe**:

- "Esse hero" → seta/print só do hero
- "Essa fonte de título" → identificar serif/sans, qual peso
- "Essa caixinha amarela com a dica" → o quadro lateral específico
- "Esse jeito de mostrar a categoria" → o badge/tag no topo

Frases curtas: "gosto desse `X` porque traz `Y`". Sem redação extensa.

## Próximos passos (depois das refs)

1. Estudo as referências e mapeio padrões comuns
2. Devolvo um moodboard textual + paleta tipográfica proposta
3. Valido a direção com você (provavelmente via `AskUserQuestion` com 2-3 escolhas)
4. Implemento em 3 PRs stacked:
   - **PR A** — Renderer + tipografia (`RichTextRenderer.tsx`)
   - **PR B** — Páginas (`/blog`, `/blog/[slug]`)
   - **PR C** — Editor admin (blocos custom no TipTap)
