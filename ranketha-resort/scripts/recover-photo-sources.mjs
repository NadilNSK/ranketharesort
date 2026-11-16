import { mkdir, writeFile } from 'node:fs/promises';

const output = new URL('../.qa/photo-recovery/', import.meta.url);
await mkdir(output, { recursive: true });
const sources = [
  ['google-maps', 'https://www.google.com/maps/search/?api=1&query=Ranketha%20Resort%20Thudugala%20194%2F4%20Thudugala%20Nahinna%20road%20Dodangoda%20Sri%20Lanka'],
  ['airpaz', 'https://www.airpaz.com/en/hotel/ranketha-resort-thudugala.4036600']
];
const found = [];
for (const [label, source] of sources) {
  const response = await fetch(source, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await response.text();
  await writeFile(new URL(`${label}.html`, output), html);
  const decoded = html.replaceAll('\\u003d', '=').replaceAll('\\u0026', '&').replaceAll('\\u003a', ':').replaceAll('\\/', '/').replaceAll('&amp;', '&');
  const urls = [...new Set([...decoded.matchAll(/https?:\/\/(?:lh\d+\.googleusercontent\.com|pix\d+\.agoda\.net|q-xx\.bstatic\.com|lbcdn\.airpaz\.com)\/[^\s"'<>\\]+/g)].map(match => match[0]))];
  found.push(...urls.filter(url => /\/p\/|gps-cs-s|hotelImages|hotelimages\/4036600|xdata\/images/.test(url)).map(url => ({ source, url })));
  console.log(JSON.stringify({ source: label, status: response.status, bytes: html.length, candidates: urls.length }));
}
await writeFile(new URL('candidates.json', output), JSON.stringify(found, null, 2));
console.log(JSON.stringify({ candidates: found.length, samples: found.slice(0, 4) }, null, 2));
