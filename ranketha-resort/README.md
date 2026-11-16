# Ranketha Resort Thudugala

A responsive static website built with HTML, CSS, and vanilla JavaScript. The workspace had no existing framework to replace.

## Run locally

```sh
npm run dev
```

Open http://127.0.0.1:4173. On Windows PowerShell, use `npm.cmd` if the system blocks `npm.ps1`. The website needs no installed packages or build step; serve `dist/` from a static host. Development dependencies prepare images and run verification.

## Content and photographs

- Exact property details, page metadata, call links and directions are in `dist/index.html`.
- `scripts/prepare-photos.mjs` contains category ordering, factual captions and alternative text. It generates `dist/photos.js` and updates the static page image references.
- All 28 supplied photographs are represented: 12 rooms, 9 outdoors and 7 food images.
- The files supplied in `D:\Down\Ranketha Resort Thudugala - Google Maps` match the original uploads byte-for-byte. They are only 202–224 pixels wide.
- The built-in image editor produced clearer AI-enhanced versions. It estimates fine detail; these are not recovered high-resolution camera originals. See [restoration details and prompts](PHOTO-RESTORATION.md).
- `photos_original/` retains every untouched source. `photos_restored/` contains the PNG enhancement masters and a prompt manifest.
- `dist/assets/photos-enhanced/` contains responsive WebP versions, JPEG fallbacks and 180px gallery thumbnails. No output is enlarged beyond its restoration master.
- `dist/assets/photos-original/` contains exact copies of the originals. Every gallery photo has a keyboard-accessible **View original / View enhanced** toggle. Without JavaScript, image links open the untouched originals.
- The page and gallery disclose AI enhancement. Photo captions describe the source photographs and do not infer additional amenities from generated detail.
- `dist/styles.css` controls the design, mobile crop, breakpoints, visible focus styles and reduced-motion support. `dist/app.js` controls the mobile menu and gallery.
- Fonts are self-hosted in `dist/assets/fonts/`, with Georgia and Arial fallbacks.
- The Google Maps embed loads from Google. The supplied rating was 4.0/5 from 110 reviews; the map's own place card manages its rating, so the site does not duplicate it. Address, Plus Code, phone and directions remain available if the embed is blocked.

The page does not invent room types, rates, occupancy, bookable inventory, restaurant hours, guest reviews, WhatsApp or booking confirmations.

## Image preparation and verification

```sh
npm install
npm run photos
npm run check
npm test
```

`npm run photos` only resizes/encodes the saved restoration masters using Sharp and copies the originals; it makes no AI API calls. `scripts/enhance_photos.py` and the old `dist/assets/photos/` files are retained as legacy artifacts and are not used by the updated website.

The browser check uses installed Microsoft Edge on Windows, or Playwright Chromium elsewhere. It starts its own temporary local server and checks layouts at 360px, 768px and 1440px, including 2× pixel density at 360px and 768px. It checks responsive image selection, all 28 enhanced/original pairs, gallery buttons/keyboard/focus, all navigation/call/directions links, the mobile contact bar and the no-JavaScript fallback. Results and screenshots are saved in `.qa/`.

## Hosting

`.openai/hosting.json` identifies the reserved private Sites project. Publication is still pending explicit approval to upload the source and photos; the website has not been pushed or deployed. The complete local website is in `dist/`.
