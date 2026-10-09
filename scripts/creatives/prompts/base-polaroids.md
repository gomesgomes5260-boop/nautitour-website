# Arte base "colagem de polaroids" (sem texto) — Higgsfield / GPT Image 2.5

Modelo: `gpt_image_2_5` · 4:5 · quality high · 2k · ~1,4 crédito por imagem.
Referências (nesta ordem): `docs/social/refs/post-2.jpg`, `docs/social/refs/post-3.jpg`, 3 fotos nossas (drone, snorkel, trampolim).

```
Background artwork for an Instagram post of the boat tour brand Escuna Estrela, in exactly the same visual
language as reference images 1 and 2 (real posts from the brand), but WITHOUT ANY TEXT, LETTERS, NUMBERS, LOGO
OR LABELS anywhere: dark petrol-teal background with a faint thin-line compass-rose watermark; three slightly
tilted torn-edge polaroids made from the supplied photos (reference images 3, 4 and 5; do not invent other
photos) arranged in the lower two thirds, overlapping a kraft paper area with hand-torn edges; a carved wooden
compass rose peeking in from the top-right corner, half outside the frame; a soft blurred tropical leaf in a
corner. Keep the upper-left third of the image (above the polaroids) completely EMPTY petrol-teal, where the
headline will be added later, and leave a clear empty kraft space at the bottom center for the logo. Natural
hand-made collage feel. Absolutely no typography of any kind.
```

Zonas (spec `exemplo-molde-hf-polaroids.json`): texto `x5 y4 w62 h34` alinhado à esquerda, logo `x32 y89 w36 h8`.

⚠️ A foto `ilhas/snorkel-ilha-01.jpg` da biblioteca é um homem de caiaque (nome errado) e está **banida** pelo dono:
nunca usar em post nem no site (`docs/brand/taxonomia-de-fotos.md`). Conferir as fotos antes de publicar.

Rosa de madeira: usar `public/brand/escuna-estrela/elementos/rosa-dos-ventos-madeira-02.png` como referência extra e trocar "a carved wooden compass rose" por "the wooden compass rose exactly like reference image N" (modelo escolhido pelo dono).
