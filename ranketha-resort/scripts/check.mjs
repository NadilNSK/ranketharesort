import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const root = new URL('../dist/', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const css = await readFile(new URL('styles.css', root), 'utf8');
const app = await readFile(new URL('app.js', root), 'utf8');
const photoScript = await readFile(new URL('photos.js', root), 'utf8');
new vm.Script(app);
const context = { window: {} };
vm.runInNewContext(photoScript, context);
const photos = context.window.RESORT_PHOTOS;
assert.equal(Object.values(photos).flat().length, 28);
assert.equal(photos.rooms.length, 12);
assert.equal(photos.outdoors.length, 9);
assert.equal(photos.food.length, 7);
for (const photo of Object.values(photos).flat()) {
  assert.ok(photo.alt && photo.caption && photo.width && photo.height);
  assert.equal(photo.enhanced, true);
  const full = await sharp(fileURLToPath(new URL(photo.src, root))).metadata();
  assert.equal(full.width, photo.width);
  assert.equal(full.height, photo.height);
  await access(new URL(photo.thumbnail, root));
  const original = await readFile(new URL(photo.original, root));
  assert.deepEqual(original, await readFile(new URL(`../photos_original/${photo.file}.jpg`, root)), 'The original must remain unaltered');
  for (const variant of photo.srcset.split(', ')) {
    const [src, descriptor] = variant.split(' ');
    const metadata = await sharp(fileURLToPath(new URL(src, root))).metadata();
    assert.equal(metadata.width, Number(descriptor.replace('w', '')));
    assert.ok(metadata.width <= photo.width, 'Never enlarge a restored master');
  }
}
for (const [, target] of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)) {
  if (!/^(https?:|tel:)/.test(target)) await access(new URL(target, root));
}
for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${target}"`), `Missing target: ${target}`);
for (const [, phone] of html.matchAll(/href="(tel:[^"]+)"/g)) assert.equal(phone, 'tel:+94706773333');
for (const [, target] of html.matchAll(/href="(https:\/\/www.google.com\/maps\/dir\/[^\"]+)"/g)) {
  const url = new URL(target.replaceAll('&amp;', '&'));
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('destination'), 'Ranketha Resort Thudugala, 194/4, Thudugala Nahinna road, Dodangoda, Matugama 12020, Sri Lanka');
}
// Google displays the live rating in its embedded place card. Do not duplicate it.
assert.equal((html.match(/data-google-rating/g) || []).length, 0);
assert.ok(html.includes('<title>Ranketha Resort Thudugala | Rooms, Photos &amp; Directions</title>'));
assert.ok(html.includes('Explore room, outdoor, and food photos from Ranketha Resort Thudugala in Dodangoda, Sri Lanka. Find directions and call for rates and availability.'));
assert.ok(html.includes('Call the resort for current room rates and availability.'));
assert.ok(css.includes('prefers-reduced-motion'));
assert.ok(html.includes('Photos enhanced with AI for clarity.'));
assert.ok(html.includes('id="gallery-original"'));
assert.ok(!html.includes('-small.webp'), 'Thumbnail assets must not be used in the page photo srcsets');
console.log('PASS: 28 enhanced photos, untouched originals, real responsive dimensions, metadata, all call/directions/anchor links, and script syntax.');
