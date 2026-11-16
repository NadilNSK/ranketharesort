# Photo restoration

Updated 17 November 2026 using the built-in image_gen tool in edit mode. All 28 supplied images were edited individually with the original photograph as the edit target.

## Source quality and limits

The user-supplied folder contains the same 28 tiny JPEGs as the uploads (202–224 pixels wide), verified by SHA-256. AI enhancement improves apparent clarity but estimates texture and fine detail. It cannot recover information absent from the source. The enhanced images must not be treated as evidence of new facilities or furnishings. Original photographs remain available for comparison in the website gallery.

## Saved files

- Untouched sources: `photos_original/<photo-name>.jpg`.
- Edited PNG masters: `photos_restored/<photo-name>.png`.
- Exact prompts and master dimensions: [photos_restored/manifest.json](photos_restored/manifest.json).
- Website WebP sizes, thumbnails and JPEG fallbacks: `dist/assets/photos-enhanced/`.
- Public untouched originals: `dist/assets/photos-original/`.
- Original/enhanced review sheets: `.qa/restoration-review/`.

Sharp is used only for resizing, format encoding and review contact sheets. The previous aggressive OpenCV upscaling pipeline is no longer used by the website.

## Prompt set

Every edit requested preservation of the original framing, perspective, geometry, colours, lighting, object placement and photographic character. Prompts prohibited new furnishings, landscaping, ingredients, garnish, signage, decorative objects and exaggerated sharpening. Scene-specific constraints were supplied for each image. The full exact prompt for every image is recorded in the linked manifest.

| Photo | Edited master dimensions |
| --- | --- |
| outdoors-garden-wide | 1536 × 1024 |
| room-plum-bed-wide | 1486 × 1058 |
| room-wood-bed | 1486 × 1058 |
| room-desk-and-mirror | 1536 × 1024 |
| outdoors-pool-evening-wide | 1538 × 1023 |
| room-open-interior | 940 × 1672 |
| room-desk-detail | 1486 × 1058 |
| room-plum-bed-close | 1087 × 1446 |
| room-two-beds | 970 × 1621 |
| room-seating-detail | 1486 × 1058 |
| room-evening-bed | 1022 × 1538 |
| room-window-and-bed | 940 × 1673 |
| room-wood-bed-wide | 940 × 1672 |
| room-lounge | 1450 × 1085 |
| outdoors-entrance | 1087 × 1446 |
| outdoors-pool-evening | 1087 × 1446 |
| outdoors-garden-and-pool | 1087 × 1446 |
| outdoors-pool-trees | 1087 × 1446 |
| outdoors-lawn-front | 1025 × 1534 |
| outdoors-lantern-path | 1025 × 1535 |
| outdoors-garden-seating | 1538 × 1023 |
| food-grill | 1087 × 1446 |
| food-platter | 1372 × 1147 |
| food-table-spread | 1085 × 1450 |
| food-garden-table | 971 × 1620 |
| food-table-details | 1868 × 842 |
| food-colourful-plate | 1168 × 1346 |
| food-pasta | 1450 × 1085 |
