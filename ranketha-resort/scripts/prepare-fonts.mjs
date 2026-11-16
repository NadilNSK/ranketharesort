import { mkdir, writeFile, readFile } from 'node:fs/promises';

const fontRoot = new URL('../dist/assets/fonts/', import.meta.url);
await mkdir(fontRoot, { recursive: true });
const cssUrl = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400..700&family=Lora:ital,wght@0,400..600;1,400..500&display=swap';
const response = await fetch(cssUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' } });
if (!response.ok) throw new Error(`Font CSS request failed: ${response.status}`);
const css = await response.text();
let latinBlocks = [...css.matchAll(/\/\* latin \*\/\s*(@font-face\s*\{[^}]+\})/g)].map(match => match[1]);
if (!latinBlocks.length) latinBlocks = [...css.matchAll(/@font-face\s*\{[^}]+\}/g)].map(match => match[0]);
if (!latinBlocks.length) throw new Error('No usable font faces returned');
const output = [];
const files = new Map();
for (let block of latinBlocks) {
  const url = block.match(/url\(([^)]+)\)/)?.[1];
  if (!url || !url.startsWith('https://fonts.gstatic.com/')) throw new Error('Unexpected font asset origin');
  let file = files.get(url);
  if (!file) {
    file = `font-${files.size + 1}.${url.endsWith('.ttf') ? 'ttf' : 'woff2'}`;
    const asset = await fetch(url);
    if (!asset.ok) throw new Error(`Font download failed: ${asset.status}`);
    await writeFile(new URL(file, fontRoot), Buffer.from(await asset.arrayBuffer()));
    files.set(url, file);
  }
  output.push(block.replace(url, `assets/fonts/${file}`));
}
for (const family of ['dmsans', 'lora']) {
  const license = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`);
  if (!license.ok) throw new Error(`Missing ${family} font license`);
  await writeFile(new URL(`${family}-OFL.txt`, fontRoot), await license.text());
}
await writeFile(new URL('../dist/fonts.css', import.meta.url), `${output.join('\n\n')}\n`);
const stylesheet = new URL('../dist/styles.css', import.meta.url);
const style = await readFile(stylesheet, 'utf8');
await writeFile(stylesheet, style.replace(/^@import url\([^\n]+\);\s*/, ''));
const htmlPath = new URL('../dist/index.html', import.meta.url);
const html = await readFile(htmlPath, 'utf8');
if (!html.includes('href="fonts.css"')) await writeFile(htmlPath, html.replace('<link rel="stylesheet" href="styles.css">', '<link rel="stylesheet" href="fonts.css">\n  <link rel="stylesheet" href="styles.css">'));
console.log(`Self-hosted ${files.size} Latin font files and both OFL licenses.`);
