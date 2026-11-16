import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';

const folder = process.argv[2];
if (!folder) throw new Error('Pass the source photo folder.');
const backups = new URL('../photos_original/', import.meta.url);
const byHash = new Map();
for (const file of await readdir(backups)) {
  if (!file.endsWith('.jpg')) continue;
  byHash.set(createHash('sha256').update(await readFile(new URL(file, backups))).digest('hex'), file);
}
const photos = [];
for (const file of await readdir(folder)) {
  if (!/\.(jpg|jpeg|png|webp)$/i.test(file)) continue;
  const bytes = await readFile(path.join(folder, file));
  const metadata = await sharp(bytes).metadata();
  const match = byHash.get(createHash('sha256').update(bytes).digest('hex'));
  photos.push({ file, width: metadata.width, height: metadata.height, identicalTo: match || null });
}
console.log(JSON.stringify({ folder, count: photos.length, exactMatches: photos.filter(p=>p.identicalTo).length, photos },null,2));
