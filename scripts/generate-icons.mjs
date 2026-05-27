import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const src = resolve(root, 'public/pwa-icon.svg');
const outDir = resolve(root, 'public');
mkdirSync(outDir, { recursive: true });

const svg = readFileSync(src);

const targets = [
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
  { size: 512, name: 'pwa-maskable-512x512.png', maskable: true },
  { size: 180, name: 'apple-touch-icon.png' },
];

for (const t of targets) {
  let pipeline = sharp(svg, { density: 384 }).resize(t.size, t.size);
  if (t.maskable) {
    pipeline = pipeline.composite([{
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${t.size}" height="${t.size}"><rect x="0" y="0" width="${t.size}" height="${t.size}" fill="#0ea5e9"/></svg>`
      ),
      blend: 'dest-over',
    }]);
  }
  await pipeline.png().toFile(resolve(outDir, t.name));
  console.log(`generated ${t.name}`);
}
