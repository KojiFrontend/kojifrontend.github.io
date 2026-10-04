import { readdir, stat, mkdir, rm, copyFile } from 'node:fs/promises';
import { join, extname, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const srcRoot = fileURLToPath(new URL('../assets/', import.meta.url));
const outRoot = fileURLToPath(new URL('../public/assets/', import.meta.url));

const passthrough = new Set(['brand/favicon.png', 'brand/glyph-logo.png', 'brand/text-logo.png']);
const jpeg = new Set(['brand/embed-banner']);
const lossy = new Set([
  'home/hero',
  'icons/bento/gamesplash',
  'shots/discord',
  'shots/leaflet',
  'shots/media',
  'shots/shop'
]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

const kb = (n) => (n / 1024).toFixed(0).padStart(6);

await rm(outRoot, { recursive: true, force: true });

const files = await walk(srcRoot);

if (files.length === 0) {
  console.error(`No source images found in ${srcRoot}`);
  process.exit(1);
}

const rows = [];
let totalBefore = 0;
let totalAfter = 0;

for (const file of files) {
  const rel = relative(srcRoot, file);
  if (!['.png', '.jpg', '.jpeg'].includes(extname(rel).toLowerCase())) continue;

  const base = rel.replace(/\.(png|jpe?g)$/i, '');
  const before = (await stat(file)).size;
  let out = join(outRoot, rel);
  let mode = 'copy';

  if (!passthrough.has(rel)) {
    if (jpeg.has(base)) {
      out = join(outRoot, `${base}.jpg`);
      mode = 'jpeg';
    } else {
      out = join(outRoot, `${base}.webp`);
      mode = lossy.has(base) ? 'lossy' : 'lossless';
    }
  }

  await mkdir(dirname(out), { recursive: true });

  if (mode === 'copy') {
    await copyFile(file, out);
  } else if (mode === 'jpeg') {
    await sharp(file).flatten({ background: '#ffffff' }).jpeg({ quality: 90, mozjpeg: true }).toFile(out);
  } else if (mode === 'lossy') {
    await sharp(file).webp({ quality: 82, effort: 6 }).toFile(out);
  } else {
    await sharp(file).webp({ lossless: true, effort: 6 }).toFile(out);
  }

  const after = (await stat(out)).size;
  totalBefore += before;
  totalAfter += after;
  rows.push({ rel, out: relative(outRoot, out), mode, before, after });
}

rows.sort((a, b) => b.before - a.before);
for (const r of rows) {
  const pct = (100 - (r.after / r.before) * 100).toFixed(0);
  console.log(`${r.rel.padEnd(30)} ${kb(r.before)}K -> ${kb(r.after)}K ${r.mode.padEnd(9)} (${pct.padStart(3)}% smaller)  ${r.out}`);
}

const pctTotal = (100 - (totalAfter / totalBefore) * 100).toFixed(0);
console.log(`\n${rows.length} files  TOTAL ${kb(totalBefore)}K -> ${kb(totalAfter)}K (${pctTotal}% smaller)`);
