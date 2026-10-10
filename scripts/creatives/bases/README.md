# Artes base (sem texto) geradas no Higgsfield

JPEG 1080 px de largura, já no formato final. Entram no molde `HF` via `arte_base` no spec; título, fato, CTA e
logo são desenhados por cima em HTML (texto e logo sempre exatos). Prompts em `../prompts/`.

| Arquivo | Layout | Foto(s) | Zonas sugeridas |
|---|---|---|---|
| `foto-faixa-01.jpg`, `-02.jpg` | foto hero → rasgo → faixa petróleo vazia → kraft com rosa de madeira | drone João Fernandes | texto `6/58/88/25`, logo `32/87/36/9` |
| `polaroids-01.jpg`, `-02.jpg` | petróleo com marca d'água → 3 polaroids rasgadas sobre kraft, rosa no canto superior direito | drone, escuna no píer, trampolim | texto `5/5/64/32` (esq.), logo `30/90/40/7` |
| `story-01.jpg`, `-02.jpg` (1080×1920) | foto hero → rasgo → faixa petróleo vazia → kraft com rosa | escuna no píer | texto `7/51/86/31`, logo `30/88/40/8` |
| `enquete-01.jpg`, `-02.jpg` (1080×1080) | petróleo em cima (pergunta) → rasgo → kraft com 3 polaroids lado a lado com borda branca pra rótulo | drone, escuna no píer, trampolim | texto `4/4/70/23`, rótulos `2/73.5/30/5.5` · `33/78.5/34/5.5` · `69/73.5/30/5`, logo `35/88/30/9` |
| `polaroid-unica-01.jpg`, `-02.jpg` | petróleo inteiro com marca d'água, 1 polaroid grande com borda inferior larga pra legenda, rosa no canto inferior esquerdo | drone João Fernandes | texto `6/2/68/15` (esq.), legenda como rótulo `14/74/72/7`, logo `32/90/36/7` |
| `fundo-enquete-01.jpg`, `-02.jpg` (1080×1080) | **só fundo**: petróleo em cima, rasgo, kraft vazio embaixo, rosa no canto superior direito, folha | nenhuma (polaroides montadas em HTML via `polaroides`) | texto `4/4/70/24`, polaroides `w 31` em x 3 / 34.5 / 66, logo `35/89/30/8` |
| `fundo-petroleo-01.jpg`, `-02.jpg` (1080×1350) | **só fundo**: petróleo com marca d'água, rosa no canto inferior esquerdo, folha no canto superior direito | nenhuma (polaroide única / cards de carrossel em HTML) | texto no topo, polaroide central, logo `32/90/36/7` |
| `anuncio-kraft-01.jpg`, `-02.jpg` (1200×628) | painel petróleo à esquerda com faixa kraft embaixo (logos no papel), foto à direita | drone João Fernandes | texto `4/7/34/62` (esq.), logo `4/80/34/16` |
| `anuncio-01.jpg`, `-02.jpg` (1200×628) | painel petróleo à esquerda com rasgo vertical, foto à direita, rosa no canto | drone João Fernandes | texto `4/8/33/60` (esq.), logo `4/74/32/18` (escuna+nautitour) |

Na 1ª tentativa de polaroids apareceu um caiaque: a foto da biblioteca `ilhas/snorkel-ilha-01.jpg` ERA o caiaque (nome errado), o modelo não inventou nada. Essa foto é **banida** (ver `docs/brand/taxonomia-de-fotos.md`); a versão atual usa a foto da escuna no píer. Conferir sempre as fotos antes de publicar.

**Desde 10/out as polaroides NÃO vêm mais pintadas na arte**: o Higgsfield gera só o fundo e o molde monta as polaroides
(`polaroides` no spec: foto, posição, largura, proporção, giro, legenda). Assim a legenda fica sempre dentro da borda,
com a mesma rotação da foto, e a foto é trocada só apontando outro arquivo.

Originais em 2K ficam na conta Higgsfield (histórico de gerações de 09/out/2026).
