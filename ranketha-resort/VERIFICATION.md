# Verification

Updated 17 November 2026. The enhanced website passed `npm run check` and `npm test` in Microsoft Edge.

- Layouts checked at 360 × 800, 768 × 1000 and 1440 × 1000 pixels. The 360px and 768px runs use 2× pixel density.
- No horizontal page overflow at any requested width.
- All 28 enhanced images and all 28 original comparisons load. Public original files match `photos_original/` byte-for-byte.
- Responsive image descriptors match actual file widths. Page images use 320px, 640px, 960px, 1280px and native-width variants as available; gallery thumbnails are kept separate. No restored master is enlarged further.
- Selected image sizes are checked against their rendered crop and pixel density, capped at the native restored master dimensions. The cropped main room image now requests a larger source on phones and tablets.
- All 13 gallery entry points open the intended category/photo.
- Previous/next, thumbnails, wraparound, arrow keys, Home/End, Escape and close controls work.
- View original / View enhanced works for every photo and with Space/Enter. The mode is labelled and announced to assistive technology.
- Modal focus remains trapped and returns to its opening link after close.
- All four navigation anchors and mobile menu open/close/Escape behavior work.
- All call links are `tel:+94706773333`; test clicks are intercepted so no real phone calls are made.
- Directions links include the exact supplied resort name and full address.
- The fixed mobile contact bar does not cover the footer.
- The hero is preloaded at high priority with matching responsive sources. Gallery/card images lazy-load.
- Essential content, original-image links, phone links and directions work without JavaScript.
- No first-party JavaScript errors or missing assets were observed.
- Original-versus-enhanced contact sheets were visually reviewed for all 28 photos; desktop hero and mobile gallery screenshots were also inspected.
- The Google Maps place card and property pin were visually verified during the original build. No additional Google rating is hardcoded elsewhere.

Automated details and screenshots are saved in `.qa/verification.json` and `.qa/`. Re-run `npm test` for browser checks or `npm run check` for asset/content/link checks.

## Image limitation

The source folder supplied by the user contains the exact same 202–224px-wide JPEGs as the uploads. The built-in image editor creates clearer versions by estimating fine detail. This is not recovery of missing original detail. The site discloses enhancement and provides untouched source photos for comparison. See [PHOTO-RESTORATION.md](PHOTO-RESTORATION.md) for saved paths and the exact prompt manifest.

## Publication

The website is complete locally. Publication is pending explicit approval: automatic approval review previously rejected uploading the site and property photographs to the external private Sites repository because that specific transfer was not explicitly authorized. No publishing retry was made during this photo update.
