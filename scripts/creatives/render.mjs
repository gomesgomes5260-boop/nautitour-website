// Renderiza criativos da Escuna Estrela a partir de um spec JSON e dos moldes HTML
// em scripts/creatives/templates/. Saída: PNG por formato.
//
//   node scripts/creatives/render.mjs scripts/creatives/specs/exemplo-molde-a.json --out /tmp/criativos
//
// Requer Playwright + Chromium (local: `npx playwright install chromium`; na nuvem
// já vem em /opt/node22). Não é dependência do site: nada disto entra no build.
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join, basename, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..', '..');

function loadPlaywright() {
  const req = createRequire(import.meta.url);
  const candidates = ['playwright'];
  try { candidates.push(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'playwright')); } catch { /* sem npm global */ }
  for (const c of candidates) { try { return req(c); } catch { /* tenta o próximo */ } }
  throw new Error('Playwright não encontrado. Rode: npm i -D playwright && npx playwright install chromium');
}

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const dataUrl = (p) => `data:${MIME[extname(p).toLowerCase()] || 'application/octet-stream'};base64,${readFileSync(p).toString('base64')}`;
const inlineSvg = (p) => readFileSync(p, 'utf8').replace(/<\?xml[^>]*\?>\s*/, '');

const args = process.argv.slice(2);
const specPath = args.find((a) => !a.startsWith('--'));
if (!specPath) { console.error('uso: node scripts/creatives/render.mjs <spec.json> [--out dir]'); process.exit(1); }
const outDir = args.includes('--out') ? args[args.indexOf('--out') + 1] : join(repo, 'out', 'criativos');
mkdirSync(outDir, { recursive: true });

const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const molde = (spec.molde || 'A').toUpperCase(); // 'HF' = arte base gerada (Higgsfield) + texto/logo por cima
const templatePath = join(here, 'templates', `molde-${molde.toLowerCase()}.html`);
if (!existsSync(templatePath)) { console.error(`molde ${molde} não existe (${templatePath})`); process.exit(1); }
const template = readFileSync(templatePath, 'utf8');
const formatos = spec.formatos || ['4x5'];
const nome = spec.nome || basename(specPath, '.json');

const rosaPath = resolve(repo, spec.rosa || 'public/brand/escuna-estrela/elementos/rosa-dos-ventos-madeira-02.png');
const assets = {
  heroSrc: spec.foto_hero ? dataUrl(resolve(repo, spec.foto_hero)) : '',
  woodSrc: existsSync(rosaPath) ? dataUrl(rosaPath) : '',
  baseSrc: spec.arte_base ? dataUrl(resolve(repo, spec.arte_base)) : '',
  logoEE: inlineSvg(join(repo, 'public/brand/escuna-estrela/logo-horizontal-cor.svg')),
  logoNT: inlineSvg(join(repo, 'public/brand/nautitour-horizontal-cor.svg')),
};

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
try {
  for (const formato of formatos) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    const SPEC = { ...spec, formato, ...assets };
    const html = template.replace('<script>', `<script>window.SPEC = ${JSON.stringify(SPEC)};</script><script>`);
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => window.__ready);
    await page.waitForTimeout(150);
    const box = await page.locator('#card').boundingBox();
    await page.setViewportSize({ width: Math.round(box.width), height: Math.round(box.height) });
    const out = join(outDir, `${nome}-${formato}.png`);
    await page.locator('#card').screenshot({ path: out, type: 'png' });
    console.log('ok', out, `${Math.round(box.width)}x${Math.round(box.height)}`);
    await page.close();
  }
} finally {
  await browser.close();
}
