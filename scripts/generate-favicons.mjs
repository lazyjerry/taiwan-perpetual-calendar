#!/usr/bin/env node
// 由 public/favicon.svg 產生整組 favicon：
//   public/favicon.ico（16/32/48 PNG 封裝）
//   public/icons/icon-{32,180,192,512}.png、icon-512-maskable.png
// 改了 favicon.svg 後重跑：npm run favicons
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'public/favicon.svg');
const iconsDir = resolve(root, 'public/icons');
const svg = await readFile(source);

async function png(size, { padding = 0, background } = {}) {
  const inner = size - padding * 2;
  let image = sharp(svg, { density: 72 * (inner / 64) * 2 }).resize(inner, inner);
  if (padding > 0) {
    image = image.extend({ top: padding, bottom: padding, left: padding, right: padding, background });
  }
  return image.png({ compressionLevel: 9 }).toBuffer();
}

function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  const blobs = [];
  let offset = 6 + 16 * images.length;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    blobs.push(data);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...blobs]);
}

await mkdir(iconsDir, { recursive: true });

const icoSizes = [16, 32, 48];
const icoImages = [];
for (const size of icoSizes) {
  icoImages.push({ size, data: await png(size) });
}
await writeFile(resolve(root, 'public/favicon.ico'), ico(icoImages));

for (const size of [32, 180, 192, 512]) {
  await writeFile(resolve(iconsDir, `icon-${size}.png`), await png(size));
}
// maskable：安全區佔中央 80%，四周補品牌底色。
await writeFile(
  resolve(iconsDir, 'icon-512-maskable.png'),
  await png(512, { padding: 64, background: '#a5382c' })
);

console.log('favicon 產生完成：public/favicon.ico、public/icons/*.png');
