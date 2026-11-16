import os
import json
import cv2
import numpy as np
from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DIST_DIR = os.path.join(PROJECT_ROOT, 'dist')
PHOTOS_DIR = os.path.join(DIST_DIR, 'assets', 'photos')
BACKUP_DIR = os.path.join(PROJECT_ROOT, 'photos_original')

ENTRIES = {
    "rooms": [
        ["room-plum-bed-wide", "Warm tones & soft light", "A bed with a plum-coloured upholstered headboard, white bedding, patterned cushions, and golden curtains beneath a chandelier."],
        ["room-wood-bed", "Wood & patterned details", "A wooden bed with white linens, a gold-patterned runner and cushions, a decorative headboard, and a standing mirror."],
        ["room-desk-and-mirror", "A closer look at the details", "A room corner with a tall wooden mirror, a desk and chair, a wall-mounted television, and an open doorway."],
        ["room-plum-bed-close", "Golden curtains & a plum headboard", "A close view of a plum-coloured bed, pale bedside tables, golden curtains, a chandelier, and a wall-mounted air-conditioning unit."],
        ["room-desk-detail", "The desk by the doorway", "A wooden desk and chair beneath a wall-mounted television, beside an open doorway and a tall mirror."],
        ["room-two-beds", "Two beds & wooden details", "A large wooden bed with a gold-patterned runner and white pillows, with a smaller bed and a tall mirror alongside."],
        ["room-open-interior", "A wider view inside", "A spacious view across a pale tiled floor toward a bed, golden curtains, a chandelier, a chair, and a tall vase."],
        ["room-seating-detail", "A corner of the room", "A wide room view with a bed on the right, a small rug, golden curtains, and a chair and decorative vase on the left."],
        ["room-evening-bed", "The room in warm evening light", "A front view of a bed with a tall plum-coloured headboard, patterned cushions, matching bedside lamps, and a glowing chandelier."],
        ["room-window-and-bed", "Light from the window", "A bed beside a tall window and golden curtains, with a chandelier overhead and a beanbag in the corner."],
        ["room-wood-bed-wide", "Carved wood & pale tiles", "A dark wooden bed with a decorative patterned headboard, white linens, a gold runner, a ceiling fan, and pale tiled flooring."],
        ["room-lounge", "A sitting area inside", "A sitting area with green upholstered seats, a wall-mounted television, a white console, curtains, and a blue-lit open doorway."]
    ],
    "outdoors": [
        ["outdoors-garden-wide", "A wide view across the lawn", "A broad green lawn in front of the resort, with a shaded veranda and tall trees along the garden."],
        ["outdoors-pool-evening-wide", "When the evening lights come on", "The illuminated resort building at dusk, with the swimming pool in the foreground and a path through the garden."],
        ["outdoors-lantern-path", "A path through the garden", "A tiled garden path bordered by flowering hedges and black lantern posts, with trees and strings of lights overhead."],
        ["outdoors-lawn-front", "The building beyond the lawn", "The resort building across a green lawn, framed by palm fronds, woven hanging lamps, and strings of light bulbs."],
        ["outdoors-garden-seating", "Seats among the greenery", "White metal chairs and a round table on the lawn, with flowering borders and the resort building behind."],
        ["outdoors-entrance", "Arriving at Ranketha", "The white resort facade and entrance viewed from a patterned paved forecourt, with potted plants along the building."],
        ["outdoors-pool-evening", "The pool at dusk", "A vertical view of the pool and the resort building at dusk, with garden lights and hanging bulbs illuminating the path."],
        ["outdoors-garden-and-pool", "The garden from above", "An elevated view of the resort building, green lawn, paths, hanging lights, and a swimming pool surrounded by trees."],
        ["outdoors-pool-trees", "The pool beside the trees", "People in and around an outdoor swimming pool beside a green building, with dense trees and palms in the background."]
    ],
    "food": [
        ["food-grill", "Over the grill", "Sausages, corn, and pieces of food cooking over the glowing coals of a round outdoor grill."],
        ["food-table-spread", "A table full of colour", "White plates of rice and an assortment of side dishes arranged along a long wooden table outdoors."],
        ["food-platter", "On the sharing plate", "A white platter piled with glazed pieces of food, sliced onions, and peppers, with bottles behind it."],
        ["food-pasta", "Fresh from the table", "Short tubes in a pale sauce on a white oval plate, topped with a green garnish on a wooden table."],
        ["food-garden-table", "Lunch with a garden view", "Plates of rice and vegetables and a serving bowl on a table beside the garden lawn and white outdoor chairs."],
        ["food-table-details", "Small plates on the table", "Small bowls of condiments with spoons and two red drinks on a dark table."],
        ["food-colourful-plate", "A closer look at the plate", "A white plate topped with sliced onions, green vegetables, and browned pieces of food, with bottles at the edge of the table."]
    ]
}

def determine_scale(filename, width, height):
    if filename == 'outdoors-garden-wide':
        return 8  # 203x135 -> 1624x1080 (HD Hero)
    if filename == 'room-plum-bed-wide':
        return 6  # 219x156 -> 1314x936 (Main room card)
    if filename == 'outdoors-pool-evening-wide':
        return 6  # 203x135 -> 1218x810 (Wide outdoors card)
    if width > height:
        return 5  # Landscape images: ~1015 - 1120px wide
    if height > 300:
        return 4  # Very tall images: ~812px wide x 1200-1464px tall
    return 4      # General images: ~812 - 896px wide

def enhance_image(img_bgr, scale, category, filename):
    h, w = img_bgr.shape[:2]
    
    # 1. Gentle noise & JPEG artifact removal
    denoise_h = 3.5 if category == 'outdoors' else 3.0
    denoised = cv2.fastNlMeansDenoisingColored(
        img_bgr, None, h=denoise_h, hColor=denoise_h,
        templateWindowSize=7, searchWindowSize=15
    )
    
    # 2. Luminance & Color Enhancement (LAB color space)
    lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    clip = 2.0 if filename == 'outdoors-garden-wide' else (1.8 if category == 'rooms' else 1.6)
    clahe = cv2.createCLAHE(clipLimit=clip, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    
    # Category-specific vibrance boost
    vib = 1.12 if category in ['food', 'outdoors'] else 1.08
    a_f = (a.astype(np.float32) - 128.0) * vib + 128.0
    b_f = (b.astype(np.float32) - 128.0) * vib + 128.0
    a_out = np.clip(a_f, 0, 255).astype(np.uint8)
    b_out = np.clip(b_f, 0, 255).astype(np.uint8)
    
    lab_adj = cv2.merge((cl, a_out, b_out))
    bgr_adj = cv2.cvtColor(lab_adj, cv2.COLOR_LAB2BGR)
    
    # 3. Two-Stage Super-Resolution (Lanczos + Bilateral filtering)
    up2x = cv2.resize(bgr_adj, (w * 2, h * 2), interpolation=cv2.INTER_LANCZOS4)
    filtered = cv2.bilateralFilter(up2x, d=5, sigmaColor=18, sigmaSpace=18)
    
    target_w = int(w * scale)
    target_h = int(h * scale)
    up_target = cv2.resize(filtered, (target_w, target_h), interpolation=cv2.INTER_LANCZOS4)
    
    # 4. Detail Enhancement
    detail = cv2.detailEnhance(up_target, sigma_s=8, sigma_r=0.12)
    
    # 5. Dual-scale unsharp masking for crisp edges and fine textures
    blur_fine = cv2.GaussianBlur(detail, (0, 0), 1.2)
    fine_mask = cv2.subtract(detail, blur_fine)
    
    blur_struct = cv2.GaussianBlur(detail, (0, 0), 2.8)
    struct_mask = cv2.subtract(detail, blur_struct)
    
    sharp = cv2.add(detail, cv2.scaleAdd(fine_mask, 0.85, np.zeros_like(detail)))
    sharp = cv2.add(sharp, cv2.scaleAdd(struct_mask, 0.25, np.zeros_like(detail)))
    
    # 6. Edge-preserving smoothing
    final = cv2.edgePreservingFilter(sharp, flags=1, sigma_s=12, sigma_r=0.15)
    return final, target_w, target_h

def main():
    os.makedirs(PHOTOS_DIR, exist_ok=True)
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    photos_metadata = {}
    total_webp_bytes = 0
    total_jpg_bytes = 0
    
    for category, items in ENTRIES.items():
        photos_metadata[category] = []
        for file_key, caption, alt in items:
            backup_input = os.path.join(BACKUP_DIR, f"{file_key}.jpg")
            if not os.path.exists(backup_input):
                orig_input = os.path.join(PHOTOS_DIR, f"{file_key}.jpg")
                img = cv2.imread(orig_input)
                cv2.imwrite(backup_input, img)
            else:
                img = cv2.imread(backup_input)
            
            orig_h, orig_w = img.shape[:2]
            scale = determine_scale(file_key, orig_w, orig_h)
            
            enhanced, target_w, target_h = enhance_image(img, scale, category, file_key)
            
            # Save enhanced JPEG
            jpg_out = os.path.join(PHOTOS_DIR, f"{file_key}.jpg")
            cv2.imwrite(jpg_out, enhanced, [cv2.IMWRITE_JPEG_QUALITY, 93])
            jpg_size = os.path.getsize(jpg_out)
            total_jpg_bytes += jpg_size
            
            # Save enhanced WebP using PIL
            webp_out = os.path.join(PHOTOS_DIR, f"{file_key}.webp")
            img_rgb = cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(img_rgb)
            pil_img.save(webp_out, 'WEBP', quality=88, method=6)
            webp_size = os.path.getsize(webp_out)
            total_webp_bytes += webp_size
            
            # Save crisp thumbnail (width ~180px)
            thumb_out = os.path.join(PHOTOS_DIR, f"{file_key}-small.webp")
            thumb_w = 180
            thumb_h = int(target_h * (thumb_w / target_w))
            pil_thumb = pil_img.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
            pil_thumb.save(thumb_out, 'WEBP', quality=85, method=6)
            
            photos_metadata[category].append({
                "file": file_key,
                "caption": caption,
                "alt": alt,
                "width": target_w,
                "height": target_h
            })
            
            print(f"[{category}] {file_key}: {orig_w}x{orig_h} -> {target_w}x{target_h} (WebP: {webp_size//1024}KB, JPG: {jpg_size//1024}KB)")
            
    # Write photos.js
    photos_js_path = os.path.join(DIST_DIR, 'photos.js')
    photos_js_content = (
        "// Enhanced high-clarity resort photos with accurate metadata.\n"
        f"window.RESORT_PHOTOS = {json.dumps(photos_metadata, indent=2)};\n"
    )
    with open(photos_js_path, 'w', encoding='utf-8') as f:
        f.write(photos_js_content)
        
    print(f"\nDone! Processed 28 photos.")
    print(f"Total full-size WebP: {total_webp_bytes / (1024*1024):.2f} MB")
    print(f"Total full-size JPG: {total_jpg_bytes / (1024*1024):.2f} MB")

if __name__ == '__main__':
    main()
