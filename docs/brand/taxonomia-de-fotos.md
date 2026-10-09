# Taxonomia de fotos

Tags da biblioteca `site-images` (tabela `site_image_tags`, `/admin/imagens`). Objetivo: um agente escolher a foto
certa pra cada molde sem olhar a imagem. Slug minúsculo, sem acento, hífen (regra do `TAG_RE` em `src/lib/image-tags.ts`).

## Dimensões (uma tag de cada, no mínimo as 4 primeiras)

| Dimensão | Tags | Obrigatória |
|---|---|---|
| Produto | `escuna` · `lancha` · `locacao` · `loja` | Sim |
| Assunto | `barco-inteiro` · `deck` · `bar` · `drink` · `pessoas` · `familia` · `casal` · `grupo` · `criancas` · `agua` · `mergulho` · `boia` · `pulo` · `ilha` · `praia` · `drone` · `pier` · `por-do-sol` · `equipe` | Sim, pode ter mais de uma |
| Orientação | `horizontal` · `vertical` · `quadrada` | Sim |
| Pessoas | `sem-pessoas` · `pessoas-longe` (não identificáveis) · `rosto-identificavel` | Sim |
| Consentimento | `consentimento-ok` (autorização registrada) · `consentimento-pendente` | Obrigatória quando `rosto-identificavel` |
| Local | `joao-fernandes` · `ilha-feia` · `tartaruga` · `rua-das-pedras` · `porto-veleiro` · `azeda` · `ossos` · `centro` | Quando souber |
| Luz | `sol-alto` · `fim-de-tarde` · `nublado` | Opcional |
| Qualidade | `hero` (serve de foto principal) · `polaroid` (serve só pequena) · `descartar` | Opcional, mas `hero` ajuda muito |
| Uso | `galeria-home` · `galeria-escuna` · `galeria-lancha` · `galeria-locacao` (já existem) · `anuncio-ok` | Como hoje |

## Regras

- `anuncio-ok` só pode ser aplicada se a foto tiver `sem-pessoas`, `pessoas-longe` ou `rosto-identificavel` + `consentimento-ok`.
- Uma foto `rosto-identificavel` sem `consentimento-ok` pode ir pro feed orgânico (decisão do dono, pendente), **nunca** pra anúncio pago.
- Nada de tag de sentimento ("linda", "incrível"). Só o que dá pra verificar na imagem.
- Tag nova só se não couber nas acima; registrar aqui no mesmo PR.

## Como o agente escolhe

| Molde | Foto hero | Polaroids |
|---|---|---|
| A | `hero` + `horizontal` + (`barco-inteiro` ou `agua` + `pessoas-longe`) | nenhuma |
| B | `hero` + `vertical` ou `horizontal` + `barco-inteiro` | 4–5 variadas: `drink`, `boia`, `ilha`, `grupo`, `drone`, sem repetir assunto |
| C | nenhuma | 2–3: `drone` + `ilha` + `barco-inteiro` |
| D | nenhuma | 3 do mesmo assunto (`ilha` × 3, `praia` × 3) com `local` diferente |
| E | nenhuma | 1 `hero`, qualquer assunto |
| Lancha (qualquer molde) | `lancha` + `hero` | `lancha` + variadas |

## Prioridade de curadoria

1. As ~55 fotos de lancha de 2025 no Drive: subir, tagear `lancha` + assunto + `hero`/`polaroid`.
2. As 279 de `fotos-passeio` e 240 de `clientes` no bucket: `pessoas`, `rosto-identificavel`, consentimento.
3. As 82 de `aerea`: `drone` + local + `hero`.
