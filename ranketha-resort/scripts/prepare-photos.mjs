import sharp from 'sharp';
import { writeFile, readFile, copyFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/assets/photos-enhanced/', import.meta.url));
const originals = new URL('../photos_original/', import.meta.url);
const masters = new URL('../photos_restored/', import.meta.url);
const publicOriginals = new URL('../dist/assets/photos-original/', import.meta.url);
await mkdir(root, { recursive: true });
await mkdir(publicOriginals, { recursive: true });
const entries = {
  rooms: [
    ['room-plum-bed-wide', 'Warm tones & soft light', 'A bed with a plum-coloured upholstered headboard, white bedding, patterned cushions, and golden curtains beneath a chandelier.'],
    ['room-wood-bed', 'Wood & patterned details', 'A wooden bed with white linens, a gold-patterned runner and cushions, a decorative headboard, and a standing mirror.'],
    ['room-desk-and-mirror', 'A closer look at the details', 'A room corner with a tall wooden mirror, a desk and chair, a wall-mounted television, and an open doorway.'],
    ['room-plum-bed-close', 'Golden curtains & a plum headboard', 'A close view of a plum-coloured bed, pale bedside tables, golden curtains, a chandelier, and a wall-mounted air-conditioning unit.'],
    ['room-desk-detail', 'The desk by the doorway', 'A wooden desk and chair beneath a wall-mounted television, beside an open doorway and a tall mirror.'],
    ['room-two-beds', 'Two beds & wooden details', 'A large wooden bed with a gold-patterned runner and white pillows, with a smaller bed and a tall mirror alongside.'],
    ['room-open-interior', 'A wider view inside', 'A spacious view across a pale tiled floor toward a bed, golden curtains, a chandelier, a chair, and a tall vase.'],
    ['room-seating-detail', 'A corner of the room', 'A wide room view with a bed on the right, a small rug, golden curtains, and a chair and decorative vase on the left.'],
    ['room-evening-bed', 'The room in warm evening light', 'A front view of a bed with a tall plum-coloured headboard, patterned cushions, matching bedside lamps, and a glowing chandelier.'],
    ['room-window-and-bed', 'Light from the window', 'A bed beside a tall window and golden curtains, with a chandelier overhead and a beanbag in the corner.'],
    ['room-wood-bed-wide', 'Carved wood & pale tiles', 'A dark wooden bed with a decorative patterned headboard, white linens, a gold runner, a ceiling fan, and pale tiled flooring.'],
    ['room-lounge', 'A sitting area inside', 'A sitting area with green upholstered seats, a wall-mounted television, a white console, curtains, and a blue-lit open doorway.']
  ],
  outdoors: [
    ['outdoors-garden-wide', 'A wide view across the lawn', 'A broad green lawn in front of the resort, with a shaded veranda and tall trees along the garden.'],
    ['outdoors-pool-evening-wide', 'When the evening lights come on', 'The illuminated resort building at dusk, with the swimming pool in the foreground and a path through the garden.'],
    ['outdoors-lantern-path', 'A path through the garden', 'A tiled garden path bordered by flowering hedges and black lantern posts, with trees and strings of lights overhead.'],
    ['outdoors-lawn-front', 'The building beyond the lawn', 'The resort building across a green lawn, framed by palm fronds, woven hanging lamps, and strings of light bulbs.'],
    ['outdoors-garden-seating', 'Seats among the greenery', 'White metal chairs and a round table on the lawn, with flowering borders and the resort building behind.'],
    ['outdoors-entrance', 'Arriving at Ranketha', 'The white resort facade and entrance viewed from a patterned paved forecourt, with potted plants along the building.'],
    ['outdoors-pool-evening', 'The pool at dusk', 'A vertical view of the pool and the resort building at dusk, with garden lights and hanging bulbs illuminating the path.'],
    ['outdoors-garden-and-pool', 'The garden from above', 'An elevated view of the resort building, green lawn, paths, hanging lights, and a swimming pool surrounded by trees.'],
    ['outdoors-pool-trees', 'The pool beside the trees', 'People in and around an outdoor swimming pool beside a green building, with dense trees and palms in the background.']
  ],
  food: [
    ['food-grill', 'Over the grill', 'Sausages, corn, and pieces of food cooking over the glowing coals of a round outdoor grill.'],
    ['food-table-spread', 'A table full of colour', 'White plates of rice and an assortment of side dishes arranged along a long wooden table outdoors.'],
    ['food-platter', 'On the sharing plate', 'A white platter piled with glazed pieces of food, sliced onions, and peppers, with bottles behind it.'],
    ['food-pasta', 'Fresh from the table', 'Short tubes in a pale sauce on a white oval plate, topped with a green garnish on a wooden table.'],
    ['food-garden-table', 'Lunch with a garden view', 'Plates of rice and vegetables and a serving bowl on a table beside the garden lawn and white outdoor chairs.'],
    ['food-table-details', 'Small plates on the table', 'Small bowls of condiments with spoons and two red drinks on a dark table.'],
    ['food-colourful-plate', 'A closer look at the plate', 'A white plate topped with sliced onions, green vegetables, and browned pieces of food, with bottles at the edge of the table.']
  ]
};
const photos = {};
let totalBytes = 0;
for (const [category, images] of Object.entries(entries)) {
  photos[category] = [];
  for (const [file, caption, alt] of images) {
    const input = fileURLToPath(new URL(`${file}.png`, masters));
    const { width, height } = await sharp(input).metadata();
    const source = new URL(`${file}.jpg`, originals);
    const originalDimensions = await sharp(fileURLToPath(source)).metadata();
    // Restoration is done with image_gen. Sharp only resizes and encodes its output.
    // Preserve the supplied original byte-for-byte for the gallery comparison.
    await copyFile(source, new URL(`${file}.jpg`, publicOriginals));
    await sharp(input).jpeg({ quality: 90, mozjpeg: true }).toFile(`${root}${file}.jpg`);
    await sharp(input).webp({ quality: 86, effort: 6 }).toFile(`${root}${file}.webp`);
    await sharp(input).resize({ width: 180, withoutEnlargement: true }).webp({ quality: 80, effort: 6 }).toFile(`${root}${file}-small.webp`);
    const variants = [];
    for (const size of [320, 640, 960, 1280].filter(size => size < width)) {
      const src = `assets/photos-enhanced/${file}-${size}.webp`;
      await sharp(input).resize({ width: size, withoutEnlargement: true }).webp({ quality: 85, effort: 6 }).toFile(`${root}${file}-${size}.webp`);
      variants.push({ src, width: size });
    }
    const src = `assets/photos-enhanced/${file}.webp`;
    variants.push({ src, width });
    totalBytes += (await stat(`${root}${file}.webp`)).size;
    photos[category].push({ file, caption, alt, width, height, src, srcset: variants.map(variant => `${variant.src} ${variant.width}w`).join(', '), thumbnail: `assets/photos-enhanced/${file}-small.webp`, original: `assets/photos-original/${file}.jpg`, originalWidth: originalDimensions.width, originalHeight: originalDimensions.height, enhanced: true });
  }
}
await writeFile(new URL('../dist/photos.js', import.meta.url), `// AI-enhanced versions of supplied photos; untouched originals are available in the gallery.\n// Edit captions and ordering in scripts/prepare-photos.mjs, then regenerate.\nwindow.RESORT_PHOTOS = ${JSON.stringify(photos, null, 2)};\n`);

// Keep the static, no-JavaScript page and hero preload in sync with the generated assets.
const byFile = Object.fromEntries(Object.values(photos).flat().map(photo => [photo.file, photo]));
const heroSizes = '(max-width: 700px) 1100px, (max-width: 850px) 900px, (min-width: 1600px) 1552px, calc(100vw - 48px)';
const cardSizes = {
  'room-plum-bed-wide': '(max-width: 700px) 130vw, (max-width: 850px) 85vw, (min-width: 1440px) 728px, 60vw',
  'room-wood-bed': '(max-width: 700px) 65vw, (min-width: 1440px) 520px, 38vw',
  'room-desk-and-mirror': '(max-width: 700px) 65vw, (min-width: 1440px) 520px, 38vw',
  'outdoors-pool-evening-wide': '(max-width: 700px) 120vw, (min-width: 1440px) 867px, 63vw',
  'outdoors-lantern-path': '(max-width: 700px) calc(100vw - 44px), (min-width: 1440px) 385px, 30vw'
};
let html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
html = html.replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/g, picture => {
  const file = picture.match(/assets\/photos(?:-enhanced)?\/([^"\s]+)\.jpg/)?.[1];
  const photo = byFile[file];
  if (!photo) throw new Error(`Unknown static photo: ${file}`);
  const isHero = picture.includes('hero-picture');
  const sizes = isHero ? heroSizes : cardSizes[file] || '(max-width: 700px) 65vw, (max-width: 850px) 60vw, (min-width: 1440px) 380px, 30vw';
  return picture.replace(/srcset="[^"]*"/, `srcset="${photo.srcset}"`)
    .replace(/sizes="[^"]*"/, `sizes="${sizes}"`)
    .replace(/src="[^"]+\.jpg"/, `src="assets/photos-enhanced/${file}.jpg"`)
    .replace(/width="\d+"/, `width="${photo.width}"`)
    .replace(/height="\d+"/, `height="${photo.height}"`);
});
html = html.replace(/href="assets\/photos\/([^"/]+)\.jpg"/g, 'href="assets/photos-original/$1.jpg"');
const hero = byFile['outdoors-garden-wide'];
html = html.replace(/<link rel="preload" as="image"[^>]+>/, `<link rel="preload" as="image" href="${hero.src}" imagesrcset="${hero.srcset}" imagesizes="${heroSizes}" fetchpriority="high">`);
html = html.replace(/(property="og:image" content="[^"]*\/assets\/)photos(?:-enhanced)?(\/)/, '$1photos-enhanced$2');
await writeFile(new URL('../dist/index.html', import.meta.url), html);
console.log(JSON.stringify({ categories: Object.fromEntries(Object.entries(photos).map(([key, items]) => [key, items.length])), fullSizeWebpBytes: totalBytes, dimensions: photos.outdoors.map(({file,width,height})=>({file,width,height})) }, null, 2));
