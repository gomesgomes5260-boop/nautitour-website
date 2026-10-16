# Vídeos sociais — Escuna Estrela

Pipeline de edição de vídeo rodando no **sandbox do Higgsfield** (ffmpeg 5.1). Nada aqui roda no Vercel.

## Regra (14/out/2026)

**Só takes de clipes reais.** Animação de foto (image-to-video) foi testada na rodada 1 e descartada pelo dono. Não gerar mais.

## Peças (13/out/2026 — rodada 1, teste, DESCARTADA)

| Peça | Fonte | Formato | Link de revisão |
|---|---|---|---|
| Animação 1 — drone João Fernandes | foto `aerea/drone-joao-fernandes-01.jpg` → Grok Video 1.5, 5 s, 720p | 1280×720 | ver `docs/social/videos/2026-10-rodada1.md` |
| Animação 2 — escuna no píer | foto `escuna/escuna-pier-01.jpg` | 1280×720 | idem |
| Animação 3 — trampolim | foto `ilhas/trampolim-01.jpg` | 960×960 | idem |
| Comercial 15 s (teste) | as 3 animações + cartão final | YouTube 1920×1080 · Feed 1080×1350 · Story 1080×1920 | idem |

## Como funciona

1. **Clipes** entram em `/home/user/anim/` (animações do Higgsfield) ou `/home/user/escuna/` (vídeos reais do Drive).
2. **`monta.py spec.json saida.mp4`** monta o vídeo: recorte *cover* pro formato, sombra no terço inferior (`shade-WxH.png`, gerada por `shade.py`), logo Escuna Estrela **variante petróleo** (ESCUNA em branco) com sombra no canto superior direito, textos com fade (Fraunces SemiBold título · Montserrat SemiBold corpo · Kalam Bold "mão"), xfade de 0,5 s entre clipes e cartão final no degradê petróleo da marca com logo grande + CTA + logo Nautitour.
3. Saída sobe pro storage do Higgsfield (`media_upload` → PUT → `media_confirm`) e o link cloudfront vai pra página de revisão.

Specs de exemplo em `specs/`. Fontes baixadas do repositório `google/fonts` (Kalam estática; Montserrat e Fraunces instanciadas em wght=600 com `fonttools varLib.instancer`).

## Inventário dos clipes do Drive (14/out)

`ingest.sh` baixa cada clipe da pasta liberada por link, gera proxy 720p + folha de 12 frames com timecode e apaga o original (o sandbox tem ~20 GB). Rodou em 3 trabalhadores paralelos (8 núcleos). Resultado: 103 de 105 clipes; 5 ficaram presos na cota de download do Google (ver `docs/social/videos/inventario-clipes.md`). `inventario-build.py` monta a página de seleção (folhas embutidas em base64 + decisão por clipe gravada no banco do artifact, coleção `clipes`).

## Rodada 2 (14/out) — comercial com clipes reais

Specs `specs/real-youtube.json`, `specs/real-feed.json`, `specs/real-story.json` (caminhos apontam pros proxies em `/home/user/escuna/proxy/`). Links e roteiro em `docs/social/videos/2026-10-rodada2.md`.

## Pendências

- Pasta do Drive liberada por link em 14/out; lembrar de voltar pra Restrito quando a edição acabar.
- Sem trilha/áudio ainda (ver opções de áudio no doc da rodada).

## Transição "rasgo de kraft" (14/out)

`monta.py` aceita `"transicao": {"tipo": "rasgo", "dur": 0.6, "tira": "<png com alpha>", "direcao": "cima|baixo|alterna"}`.
A tira **oficial é gerada no Higgsfield** (`gpt_image_2_5`, `aspect_ratio` 21:9, `quality` high, `resolution` 2k,
`background` transparent, `image_references` = `scripts/creatives/bases/fundo-enquete-02.jpg`) com o prompt:

> A single horizontal strip of torn kraft paper spanning the entire width of the image, centered vertically, about
> one third of the image height tall. Both the top edge and the bottom edge are irregularly hand-torn, with soft
> fibrous white paper fibers along the tears, small jagged bits and gentle waves, like paper ripped by hand. The paper
> has the same warm off-white kraft texture, grain and subtle fibers as the reference image. Flat, evenly lit, no
> shadow, no other objects, no text, no leaves, no compass. Everything outside the strip is fully transparent.

Depois: recortar pelo alpha, redimensionar pra largura do vídeo e adicionar sombra suave (6 px pra baixo, blur 10,
55 %). `tira.py` (tira procedural) fica só como fallback sem crédito — o dono reprovou o visual dela.
