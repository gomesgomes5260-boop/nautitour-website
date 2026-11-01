#!/usr/bin/env python3
"""Gera o overlay transparente de uma arte do molde HF pra usar em vídeo.

A área da foto (acima do rasgo) vira transparente; a franja kraft do rasgo, o
bloco petróleo, textos e logo ficam opacos. Uso:

  python3 scripts/video/overlay-de-arte.py <arte.png> <base.jpg> <saida.png>

<arte.png> é o render do molde HF (render.mjs) e <base.jpg> é a arte_base do
spec (ex.: scripts/creatives/bases/story-02.jpg) — a máscara é calculada na base,
subindo coluna a coluna pelo petróleo e pela franja contígua (tolera buracos de
3 px) sem confundir com brilhos do mar. Depois: ffmpeg ... -loop 1 -i saida.png
... overlay=0:0:shortest=1.
"""
import sys
import numpy as np
from PIL import Image

arte, base_p, saida = sys.argv[1:4]
art = Image.open(arte).convert('RGBA')
base = np.array(Image.open(base_p).convert('RGB')).astype(int)
H, W, _ = base.shape
mx = base.max(axis=2); mn = base.min(axis=2)
kraft = (base.sum(axis=2) / 3 > 150) & (mx - mn < 75)   # claro e pouco saturado
dark = base.sum(axis=2) / 3 < 120                        # petróleo / sombra
top = np.zeros(W, int)
for x in range(W):
    y = int(H * 0.6)
    while y > int(H * 0.45) and dark[y, x]:
        y -= 1
    gap = 0; last = y
    while y > int(H * 0.45):
        if kraft[y, x]:
            last = y; gap = 0
        else:
            gap += 1
            if gap > 3:
                break
        y -= 1
    top[x] = last
k = 4
top = np.array([int(np.median(top[max(0, i - k):i + k + 1])) for i in range(W)])
alpha = np.full((H, W), 255, np.uint8)
for x in range(W):
    alpha[:top[x], x] = 0
a = np.array(art)
a[:, :, 3] = np.minimum(a[:, :, 3], alpha)
Image.fromarray(a).save(saida)
print(f'ok {saida} — rasgo entre y={top.min()} e y={top.max()}')
