# Lote de lançamento (09/out/2026) — 13 peças (19 specs) em revisão, rodada 2

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

| # | Peça | Pilar | Canal | Formato | Rodada 1 (10/out) |
|---|---|---|---|---|---|
| 01 | venda-horarios | Venda | feed | 4:5 | aprovada |
| 02 | venda-preco | Venda | feed | 4:5 | aprovada |
| 03 | prova-experiencia | Prova | feed | 4:5 | aprovada |
| 04 | prova-boia-bar | Prova | feed | 4:5 | refeita: "tapete flutuante" no lugar de "mergulho" |
| 05 | enquete-parada | Engajamento | feed | 1:1 | refeita: polaroides pintadas (enquete-01) com fotos 1/2/4 escolhidas pelo dono encaixadas nos quadros |
| 06 | enquete-momento | Engajamento | feed | 1:1 | refeita: idem 05 na enquete-02, fotos provisórias (3/27/32) |
| 07a–d | curiosidade-praias | Engajamento | feed | 4:5 ×4 | virou carrossel de 4 cards (polaroid-unica-01/02 pintada + foto encaixada no quadro, CTA no último) |
| 08a–d | como-funciona | Educativo | feed | 4:5 ×4 | virou carrossel de 4 cards (embarque → paradas → bar + CTA) |
| 09 | story-horarios | Venda | story | 9:16 | aprovada |
| 10a/b/c | story-amanha | Venda | story | 9:16 ×3 | 3 versões (9h30 e 12h / 11h30 / 12h) pedidas pelo dono; o 10 original saiu |
| 11 | anuncio-whatsapp | Venda | meta-ads | 1200×628 | **descartada** (`_descartado-11-…json`) |
| 12 | anuncio-site | Venda | meta-ads | 1200×628 | refeita: anuncio-kraft (logos na faixa de papel) |

Carrosséis: cada card é um spec (`07a`…`07d`), ligados por `carrossel` no spec e listados em `lote.json → carrosseis`.
Legenda, hashtags e link ficam iguais nos 4 cards (o Instagram usa uma legenda por carrossel). As fotos das
polaroides de 06/07/08 são **provisórias** (números da folha de fotos em `observacoes`): o dono troca apontando
outro número e o spec só muda o `foto`.

Falta: pilar **lancha privativa** (sem fotos curadas ainda) — entra no lote 2.

## URL pública dos criativos (pro Adspirer / Meta)

Os renders ficam em `public/criativos/2026-10-lancamento/` (JPEG q92 + `.txt` + `index.json`), servidos em
`https://www.nautitour.com.br/criativos/2026-10-lancamento/<peça>.jpg`. Sem link em lugar nenhum, `noindex` no
header e `/criativos/` no robots: é só pra ferramenta de anúncio buscar o arquivo. Regerar depois de mudar um spec:

```bash
node scripts/creatives/render.mjs scripts/creatives/lotes/2026-10-lancamento --out public/criativos/2026-10-lancamento --jpg
```

(e apagar o render de peças descartadas, ex. a 11). Enquanto a PR não está em produção, o mesmo arquivo serve
pela URL do GitHub: `https://raw.githubusercontent.com/gomesgomes5260-boop/nautitour-website/main/public/criativos/...`.
