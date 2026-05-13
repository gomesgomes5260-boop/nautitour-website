// Script one-shot pra extrair as 3 variantes da swatch sheet com fundo
// transparente:
//   public/brand/logomark.png (695x195 com 3 variantes lado a lado)
//
// Gera:
//   - logo-charcoal.png  → logo escura, fundo transparente (pra bg claro)
//   - logo-white.png     → logo clara, fundo transparente (pra bg escuro)
//   - logo-knockout.png  → idem, gerada do bloco knockout (preto puro)
//
// Run: node scripts/extract-logo-variants.mjs

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'public/brand/logomark.png');

// Coordenadas das 3 variantes na swatch sheet 695x195.
const REGIONS = [
  // Charcoal mono (1ª coluna, logo escura em fundo claro)
  { name: 'logo-charcoal.png', left: 30, top: 18, width: 170, height: 125, darkLogo: true },
  // White mono (2ª coluna, logo clara em fundo charcoal-700)
  { name: 'logo-white.png',    left: 262, top: 18, width: 170, height: 125, darkLogo: false },
  // Knockout (3ª coluna, logo clara em fundo preto)
  { name: 'logo-knockout.png', left: 494, top: 18, width: 170, height: 125, darkLogo: false },
];

for (const r of REGIONS) {
  // 1. Extrai região + força RGBA
  const { data, info } = await sharp(SRC)
    .extract({ left: r.left, top: r.top, width: r.width, height: r.height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 2. Walk pixels e aplica chroma key por luminância
  //    Logo escura em fundo claro → pixels claros viram transparentes
  //    Logo clara em fundo escuro → pixels escuros viram transparentes
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const red = data[i], green = data[i + 1], blue = data[i + 2];
    const luma = 0.299 * red + 0.587 * green + 0.114 * blue;

    let alpha;
    let outR, outG, outB;

    if (r.darkLogo) {
      // Logo escura em fundo claro: pixels escuros viram opacos, claros transparentes.
      // Threshold suave entre 60 (opaco) e 240 (transparente).
      if (luma <= 60) alpha = 255;
      else if (luma >= 240) alpha = 0;
      else alpha = Math.round(((240 - luma) / (240 - 60)) * 255);
      outR = 0x40; outG = 0x40; outB = 0x40;
    } else {
      // Logo clara em fundo escuro: pixels CLAROS viram opacos, escuros transparentes.
      // Threshold mais agressivo: < 130 totalmente transparente (cobre charcoal-700 #404040
      // luma ~64 e charcoal-900 #1F1F1F luma ~31 + semi-transparentes do antialiasing).
      if (luma >= 220) alpha = 255;
      else if (luma <= 130) alpha = 0;
      else alpha = Math.round(((luma - 130) / (220 - 130)) * 255);
      outR = 0xFF; outG = 0xFF; outB = 0xFF;
    }

    out[i] = outR;
    out[i + 1] = outG;
    out[i + 2] = outB;
    out[i + 3] = alpha;
  }

  // 3. Salva PNG com canal alpha
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(ROOT, 'public/brand', r.name));

  console.log(`✓ ${r.name}  (${info.width}x${info.height}, transparent bg)`);
}
console.log('Done.');
