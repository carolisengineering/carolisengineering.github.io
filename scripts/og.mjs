// Renders static/og.png, the 1200x630 social preview card, from the real homepage:
// the wordmark, headline, lede, and the first project's diagram. Re-run after changing any of them.
import { join } from 'node:path';
import { chromium } from 'playwright';
import { buildSite, ROOT, serve } from '../tests/helpers.mjs';

const site = buildSite({ about: (a) => a });
const server = await serve(site.out);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(server.url + '/');
await page.evaluate(() => {
  const html = (selector) => document.querySelector(selector).outerHTML;
  document.body.innerHTML = '<div class="og">' + html('.brand') + html('.hero h1') + html('.hero .lede') + html('.tile .diagram') + '</div>';
});
await page.addStyleTag({ content: `
  .og { display: flex; flex-direction: column; width: 1200px; height: 630px; padding: 64px 80px; background: var(--bg); }
  .og .brand { margin: 0; padding: 0; font-size: 34px; }
  .og h1 { margin-top: 56px; font-size: 68px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; }
  .og .highlight { color: var(--secondary); }
  .og .lede { max-width: 30em; margin-top: 24px; color: var(--muted); font-size: 28px; line-height: 1.4; }
  .og .diagram { gap: 14px; margin-top: auto; }
  .og .step { gap: 14px; }
  .og .node { padding: 12px 20px; border-width: 2px; border-radius: 10px; font-size: 24px; }
  .og .edge { width: 40px; height: 20px; }
` });
await page.evaluate(() => document.fonts.ready);
const file = join(ROOT, 'static/og.png');
await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1200, height: 630 } });
console.log(file);
await browser.close();
server.close();
