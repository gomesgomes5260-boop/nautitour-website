#!/usr/bin/env python3
"""Gera a tira de kraft rasgada (PNG com alpha) usada na transição "rasgo" do monta.py.

Uso: python3 tira.py LARGURA ALTURA saida.png [seed]
Ex.: python3 tira.py 1080 270 tira-kraft-1080.png 11   (story/feed: 14 % da altura do story)

A textura vem da base pintada `scripts/creatives/bases/fundo-enquete-02.jpg` (faixa de kraft sem objetos);
as bordas são rasgadas por ruído de baixa frequência + jitter fino suavizado, com fibras claras por dentro
e uma sombra semitransparente por fora (escurece o vídeo que passa por baixo). Mesmo seed = mesmo rasgo.
"""
import sys, numpy as np
from PIL import Image
W = int(sys.argv[1]); HS = int(sys.argv[2]); out = sys.argv[3]; seed = int(sys.argv[4]) if len(sys.argv) > 4 else 7
rng = np.random.default_rng(seed)
src = Image.open('/home/user/work/fundo-enquete-02.jpg').convert('RGB')
tex = src.crop((80, 520, 1080, 790)).resize((W, max(HS, 270)), Image.LANCZOS).crop((0, 0, W, HS))


def borda(amp, n):
    x = np.arange(n); y = np.zeros(n)
    for k, a in enumerate([1.0, 0.5, 0.25, 0.12]):
        f = rng.uniform(0.004, 0.009) * (k + 1)
        y += a * np.sin(x * f * 2 * np.pi + rng.uniform(0, 6.28))
    y += rng.normal(0, 0.18, n).cumsum() * 0.08
    y -= y.mean(); y *= amp / (np.abs(y).max() + 1e-6)
    return y


fino = lambda: np.convolve(rng.normal(0, 3.2, W + 8), np.ones(9) / 9, 'valid')
marg = int(HS * 0.17)
top = marg + borda(marg * 0.55, W) + fino()
bot = HS - marg + borda(marg * 0.55, W) + fino()
yy = np.arange(HS)[:, None]
inside = (yy >= top[None, :]) & (yy <= bot[None, :])
alpha = inside.astype(np.float32)
fib = ((yy >= top[None, :]) & (yy < top[None, :] + rng.integers(2, 7, W)[None, :])) | \
      ((yy <= bot[None, :]) & (yy > bot[None, :] - rng.integers(2, 7, W)[None, :]))
rgb = np.asarray(tex).astype(np.float32)
rgb[fib] = rgb[fib] * 0.35 + np.array([244, 241, 232]) * 0.65
dist_top = top[None, :] - yy; dist_bot = yy - bot[None, :]
d = np.where(dist_top > 0, dist_top, np.where(dist_bot > 0, dist_bot, 0)).astype(np.float32)
sh = np.clip(1 - d / 22.0, 0, 1) * (d > 0) * 0.55
rgba = np.zeros((HS, W, 4), np.float32)
rgba[..., :3] = rgb; rgba[..., 3] = alpha * 255
m = (alpha == 0) & (sh > 0)
rgba[m, :3] = 0; rgba[m, 3] = sh[m] * 255
img = Image.fromarray(rgba.astype(np.uint8), 'RGBA'); img.save(out); print('tira', img.size)
