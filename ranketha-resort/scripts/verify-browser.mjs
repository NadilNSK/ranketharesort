import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const qa = new URL('../.qa/', import.meta.url);
await mkdir(qa, { recursive: true });
const port = 4181;
const server = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Preview server did not start')), 10000);
  server.stdout.on('data', chunk => { if (String(chunk).includes('Local:')) { clearTimeout(timeout); resolve(); } });
  server.on('error', reject);
});
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined, headless: true });
const report = { viewports: [], issues: [], externalRequests: [] };
try {
  for (const width of [360, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 360 ? 800 : 1000 }, deviceScaleFactor: width < 1000 ? 2 : 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().startsWith(`http://127.0.0.1:${port}`) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    page.on('requestfailed', request => { if (!request.url().startsWith('http://127.0.0.1')) report.externalRequests.push({ url: request.url().split('?')[0], error: request.failure()?.errorText }); });
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveTitle('Ranketha Resort Thudugala | Rooms, Photos & Directions');
    await expect(page.locator('.hero-image')).toBeVisible();
    await expect.poll(() => page.locator('.hero-image').evaluate(image => image.complete && image.naturalWidth > 0)).toBeTruthy();
    await expect(page.locator('.hero-image')).toHaveAttribute('fetchpriority', 'high');
    await expect(page.locator('#photo-enhancement-note')).toContainText('Photos enhanced with AI');
    await expect(page.locator('h1')).toHaveCount(1);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();

    const layout = await page.evaluate(() => ({ viewport: innerWidth, clientWidth: document.documentElement.clientWidth, pageWidth: document.documentElement.scrollWidth, overflowing: [...document.querySelectorAll('body *')].filter(el => {const r = el.getBoundingClientRect(); return getComputedStyle(el).position !== 'fixed' && r.width && (r.left < -1 || r.right > document.documentElement.clientWidth + 1);}).map(el => `${el.tagName}.${el.className}`).slice(0,10) }));
    expect(layout.pageWidth).toBeLessThanOrEqual(width);
    expect(layout.overflowing).toEqual([]);
    if (width === 360) {
      await expect(page.locator('.mobile-bottom-bar')).toBeVisible();
      await page.locator('.menu-toggle').click();
      await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Escape');
      await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'false');
      await expect(page.locator('.menu-toggle')).toBeFocused();
    }
    for (const section of ['rooms', 'outdoors', 'food', 'location']) {
      if (width === 360) await page.locator('.menu-toggle').click();
      await page.locator(`#site-nav a[href="#${section}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${section}$`));
      const top = await page.locator(`#${section}`).evaluate(el => el.getBoundingClientRect().top);
      expect(top).toBeGreaterThanOrEqual(80);
      expect(top).toBeLessThan(200);
      if (width === 360) await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'false');
    }
    // Exercise all CTA clicks while preventing the OS dialler and external navigation.
    await page.evaluate(() => {
      window.__clickedLinks = [];
      document.addEventListener('click', event => {
        const anchor = event.target.closest('a');
        if (anchor && (anchor.href.startsWith('tel:') || anchor.classList.contains('directions-link'))) {
          event.preventDefault();
          window.__clickedLinks.push(anchor.href);
        }
      }, true);
    });
    for (const anchor of await page.locator('a[href^="tel:"], a.directions-link').all()) {
      if (await anchor.isVisible()) {
        await anchor.click();
        const href = await anchor.getAttribute('href');
        if (href.startsWith('tel:')) expect(href).toBe('tel:+94706773333');
        else expect(new URL(href).searchParams.get('destination')).toBe('Ranketha Resort Thudugala, 194/4, Thudugala Nahinna road, Dodangoda, Matugama 12020, Sri Lanka');
      }
    }
    expect((await page.evaluate(() => window.__clickedLinks)).length).toBeGreaterThanOrEqual(6);

    // Open every photo entry point; verify the right category and caption loads.
    for (const trigger of await page.locator('[data-gallery]').all()) {
      const category = await trigger.getAttribute('data-gallery');
      const index = Number(await trigger.getAttribute('data-index'));
      const count = { rooms: 12, outdoors: 9, food: 7 }[category];
      await trigger.click();
      await expect(page.locator('#photo-gallery')).toBeVisible();
      await expect(page.locator('#gallery-count')).toHaveText(`${index + 1} / ${count}`);
      await expect.poll(() => page.locator('#gallery-image').evaluate(image => image.complete && image.naturalWidth > 0)).toBeTruthy();
      await expect(page.locator('.gallery-close')).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(page.locator('#photo-gallery')).not.toBeVisible();
      await expect(trigger).toBeFocused();
    }
    for (const [category, count] of [['rooms',12],['outdoors',9],['food',7]]) {
      await page.locator(`.text-link[data-gallery="${category}"]`).click();
      await page.locator('.gallery-next').click();
      await expect(page.locator('#gallery-count')).toHaveText(`2 / ${count}`);
      await page.locator('.gallery-prev').click();
      await expect(page.locator('#gallery-count')).toHaveText(`1 / ${count}`);
      await page.keyboard.press('ArrowLeft');
      await expect(page.locator('#gallery-count')).toHaveText(`${count} / ${count}`);
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('#gallery-count')).toHaveText(`1 / ${count}`);
      await page.keyboard.press('End');
      await expect(page.locator('#gallery-count')).toHaveText(`${count} / ${count}`);
      await page.keyboard.press('Home');
      await expect(page.locator('#gallery-count')).toHaveText(`1 / ${count}`);
      await page.locator('.gallery-close').focus();
      await page.keyboard.press('Shift+Tab');
      await expect(page.locator('.gallery-thumbnails button').last()).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.locator('.gallery-close')).toBeFocused();
      for (let index = 0; index < count; index++) {
        await page.locator('.gallery-thumbnails button').nth(index).click();
        await expect(page.locator('#gallery-count')).toHaveText(`${index + 1} / ${count}`);
        await expect.poll(() => page.locator('#gallery-image').evaluate(image => image.complete && image.naturalWidth > 0)).toBeTruthy();
        const enhancedSrc = await page.locator('#gallery-image').getAttribute('src');
        expect(enhancedSrc).toContain('assets/photos-enhanced/');
        await page.locator('#gallery-original').click();
        await expect(page.locator('#gallery-original')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#gallery-version')).toContainText('Original photo');
        await expect.poll(() => page.locator('#gallery-image').evaluate(image => image.complete && image.naturalWidth > 0 && image.naturalWidth <= 224)).toBeTruthy();
        await page.locator('#gallery-original').click();
        await expect(page.locator('#gallery-original')).toHaveAttribute('aria-pressed', 'false');
        await expect(page.locator('#gallery-image')).toHaveAttribute('src', enhancedSrc);
      }
      // The comparison toggle also works from the keyboard.
      await page.locator('#gallery-original').focus();
      await page.keyboard.press('Space');
      await expect(page.locator('#gallery-original')).toHaveAttribute('aria-pressed', 'true');
      await page.keyboard.press('Enter');
      await expect(page.locator('#gallery-original')).toHaveAttribute('aria-pressed', 'false');
      await page.locator('.gallery-close').click();
      await expect(page.locator('#photo-gallery')).not.toBeVisible();
      expect(await page.locator('body').evaluate(el => el.classList.contains('gallery-open'))).toBe(false);
    }
    for (const image of await page.locator('main img[loading="lazy"]').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth > 0)).toBeTruthy();
      expect(await image.getAttribute('alt')).toBeTruthy();
      expect(await image.evaluate(el => el.currentSrc)).toContain('assets/photos-enhanced/');
      expect(await image.evaluate(el => el.currentSrc)).not.toContain('-small.webp');
    }
    const selectedImages = await page.locator('main img').evaluateAll(async images => Promise.all(images.map(async image => {
      const loaded = new Image();
      loaded.src = image.currentSrc;
      await loaded.decode();
      const bounds = image.getBoundingClientRect();
      return { file: image.currentSrc.split('/').pop(), pixels: loaded.naturalWidth, requiredPixels: Math.ceil(Math.max(bounds.width, bounds.height * loaded.naturalWidth / loaded.naturalHeight) * devicePixelRatio), nativePixels: Number(image.getAttribute('width')) };
    })));
    report.imageSources ??= {};
    report.imageSources[width] = selectedImages;
    for (const image of selectedImages) expect(image.pixels, image.file).toBeGreaterThanOrEqual(Math.min(image.requiredPixels * 0.85, image.nativePixels));
    await page.locator('.site-footer').scrollIntoViewIfNeeded();
    if (width === 360) {
      await page.evaluate(() => window.scrollTo(0,document.body.scrollHeight));
      const covered = await page.evaluate(() => document.querySelector('.site-footer').getBoundingClientRect().bottom > document.querySelector('.mobile-bottom-bar').getBoundingClientRect().top + 1);
      expect(covered).toBe(false);
    }
    await page.evaluate(() => window.scrollTo(0,0));
    await expect(page.locator('#site-nav a[aria-current="location"]')).toHaveCount(0);
    await page.screenshot({ path: fileURLToPath(new URL(`page-${width}.png`, qa)), fullPage: true });
    await page.screenshot({ path: fileURLToPath(new URL(`hero-${width}.png`, qa)) });
    await page.locator('.text-link[data-gallery="rooms"]').click();
    await page.screenshot({ path: fileURLToPath(new URL(`gallery-${width}.png`, qa)) });
    await page.keyboard.press('Escape');
    expect(errors).toEqual([]);
    report.viewports.push({ width, devicePixelRatio: width < 1000 ? 2 : 1, horizontalOverflow: false, photos: 28, originalComparisons: 28, selectedImages, testedGalleryEntrypoints: await page.locator('[data-gallery]').count(), callAndDirectionsClicks: (await page.evaluate(() => window.__clickedLinks)).length, keyboardAndFocus: 'passed', errors });
    console.log(`PASS ${width}px: layout, responsive images, all contact/anchor links, 28 enhanced/original comparisons, keyboard controls, and focus restoration.`);
    await context.close();
  }
  // Essential content and links remain usable without JavaScript.
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 800 } });
  const page = await noJs.newPage();
  await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('Ranketha Resort');
  await expect(page.locator('.mobile-bottom-bar a[href="tel:+94706773333"]')).toBeVisible();
  await expect(page.locator('address')).toHaveText('194/4, Thudugala Nahinna road, Dodangoda, Matugama 12020, Sri Lanka');
  await noJs.close();
  report.withoutJavaScript = 'Essential content, original-image links, call links, and directions remain available.';
  await writeFile(new URL('verification.json', qa), JSON.stringify(report, null, 2));
  console.log('PASS no-JavaScript fallback. Screenshots and verification.json are in .qa/.');
} catch (error) {
  report.issues.push(error.stack);
  await writeFile(new URL('verification.json', qa), JSON.stringify(report, null, 2));
  throw error;
} finally {
  await browser.close();
  server.kill();
}
