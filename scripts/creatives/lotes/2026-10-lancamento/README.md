# Lote de lançamento (09/out/2026) — 12 peças em revisão

**Regra do dono: nada é publicado automaticamente.** Cada peça só sai depois de aprovada por ele. Aprovar libera a
peça para a fila de publicação manual; nenhum agente posta sozinho.

Cada `NN-nome.json` é um spec completo: arte (`arte_base` + `zonas`), texto na arte (`titulo`, `fato`, `cta`,
`rotulos`), e o pacote de publicação (`pilar`, `canal`, `persona`, `legenda`, `hashtags`, `destino` com UTM,
`observacoes`). Renderizar tudo:

```bash
node scripts/creatives/render.mjs scripts/creatives/lotes/2026-10-lancamento --out out/lote1
```

Sai um PNG por peça e um `.txt` ao lado com legenda + hashtags + link (é o que o agente de publicação, quando
existir, vai ler). A revisão do dono acontece na página de revisão (artifact), que grava decisão e comentário
por peça; o resultado volta pra cá como ajuste nos specs.

| # | Peça | Pilar | Canal | Formato |
|---|---|---|---|---|
| 01 | venda-horarios | Venda | feed | 4:5 |
| 02 | venda-preco | Venda | feed | 4:5 |
| 03 | prova-experiencia | Prova | feed | 4:5 |
| 04 | prova-boia-bar | Prova | feed | 4:5 |
| 05 | enquete-parada | Engajamento | feed | 1:1 |
| 06 | enquete-momento | Engajamento | feed | 1:1 |
| 07 | curiosidade-praias | Engajamento | feed | 4:5 |
| 08 | educativo-como-funciona | Educativo | feed | 4:5 |
| 09 | story-horarios | Venda | story | 9:16 |
| 10 | story-amanha | Venda | story | 9:16 |
| 11 | anuncio-whatsapp | Venda | meta-ads | 1200×628 |
| 12 | anuncio-site | Venda | meta-ads | 1200×628 |

Falta: pilar **lancha privativa** (sem fotos curadas ainda) — entra no lote 2.
