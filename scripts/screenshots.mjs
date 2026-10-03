// Full-page screenshots of the key pages at phone and desktop widths, written to screenshots/.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { buildSite, ROOT, serve } from '../tests/helpers.mjs';

const site = buildSite({ about: (a) => a, args: ['--minify'] });
const server = await serve(site.out);
const browser = await chromium.launch();
const dir = join(ROOT, 'screenshots');
mkdirSync(dir, { recursive: true });

const pages = { home: '/', 'office-hours': '/projects/office-hours/', '404': '/404.html' };
for (const width of [375, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  for (const [name, path] of Object.entries(pages)) {
    await page.goto(server.url + path);
    await page.evaluate(() => document.fonts.ready);
    const file = join(dir, `${name}-${width}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(file);
  }
  await page.close();
}
await browser.close();
server.close();
