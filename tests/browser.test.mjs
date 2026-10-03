import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { buildSite, fillPlaceholders, frontMatter, serve } from './helpers.mjs';

const site = buildSite({ args: ['--minify'] });
let server;
let browser;
before(async () => {
  server = await serve(site.out);
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  server?.close();
});

// Runs in the page: every visible text node against its nearest opaque background.
function contrastAudit() {
  const parseColor = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r, g, b, a };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const background = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const c = parseColor(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) return c;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  const failures = [];
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const el = walker.currentNode.parentElement;
    if (!walker.currentNode.textContent.trim() || seen.has(el) || !el.getClientRects().length) continue;
    seen.add(el);
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden') continue;
    const [fg, bg] = [lum(parseColor(style.color)), lum(background(el))];
    const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
    const size = parseFloat(style.fontSize);
    const large = size >= 24 || (Number(style.fontWeight) >= 700 && size >= 18.66);
    const min = large ? 3 : 4.5;
    if (ratio < min) failures.push(`<${el.tagName.toLowerCase()} class="${el.className}"> "${el.textContent.trim().slice(0, 30)}" ${ratio.toFixed(2)} < ${min}`);
  }
  return failures;
}

const PAGES = ['/', '/projects/office-hours/', '/projects/strength-in-numbers/', '/404.html'];

for (const width of [375, 1280]) {
  for (const path of PAGES) {
    test(`${path} at ${width}px: AA contrast, no horizontal scroll, fonts load`, async () => {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(server.url + path);
      await page.evaluate(() => document.fonts.ready);
      assert.deepEqual(await page.evaluate(contrastAudit), []);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 0, `scrolls horizontally by ${overflow}px`);
      assert.ok(await page.evaluate(() => document.fonts.check('16px Inter')));
      await page.close();
    });
  }
}

test('TOC highlights the section being read, and is hidden below 800px', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${server.url}/projects/office-hours/`);
  const id = await page.locator('.cs-article h2').nth(2).getAttribute('id');
  await page.evaluate((target) => {
    const h = document.getElementById(target);
    window.scrollTo(0, h.getBoundingClientRect().top + window.scrollY - 10);
  }, id);
  await page.waitForSelector(`.toc a.is-active[href="#${id}"]`, { timeout: 2000 });
  assert.equal(await page.locator('.toc a.is-active').count(), 1);
  await page.setViewportSize({ width: 700, height: 900 });
  assert.equal(await page.locator('.toc').isVisible(), false);
  await page.close();
});

test('keyboard focus shows a 2px primary outline', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(server.url + '/');
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement);
    return [s.outlineStyle, s.outlineWidth, s.outlineColor];
  });
  assert.deepEqual(outline, ['solid', '2px', 'rgb(29, 95, 122)']);
  await page.close();
});

test('long unbroken strings never cause horizontal scroll at 375px', async () => {
  const long = 'eval/results/20260910T003540+0000__bm25__v1.json';
  const fm = frontMatter('content/projects/office-hours.md')
    .replace('tags: [', 'tags: [AVeryLongTagNameWithoutAnySpacesAtAllForTesting, ')
    .replace('label: Knowledge base', 'label: KnowledgeBaseWithAnExtremelyLongUnbrokenLabelForTesting');
  const body = `## The problem\n\nSee ${long} and https://github.com/carolisengineering/office-hours/blob/main/eval/results/20260910T003540+0000__bm25__v1.json and \`${long}\`.\n\n\`\`\`\n${long} ${long}\n\`\`\`\n`;
  const s = buildSite({
    about: (a) => {
      const f = fillPlaceholders(a);
      return {
        ...f,
        headline: 'Supercalifragilisticexpialidocious-engineering',
        intro: `Intro ${long}`,
        facts: [{ value: 'Supercalifragilisticexpialidocious', label: long }, ...f.facts],
      };
    },
    files: { 'content/projects/office-hours.md': fm + body },
  });
  const srv = await serve(s.out);
  const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
  try {
    for (const path of ['/', '/projects/office-hours/']) {
      await page.goto(srv.url + path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 0, `${path} scrolls horizontally by ${overflow}px`);
    }
  } finally {
    await page.close();
    srv.close();
  }
});

test('keyboard focus keeps each element\'s own corner radius', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(server.url + '/');
  const seen = {};
  for (let i = 0; i < 12 && Object.keys(seen).length < 2; i++) {
    await page.keyboard.press('Tab');
    const [cls, radius] = await page.evaluate(() => [document.activeElement.className, getComputedStyle(document.activeElement).borderTopLeftRadius]);
    if (/\bbutton\b/.test(cls) && !seen.button) seen.button = radius;
    if (/\btile\b/.test(cls) && !seen.tile) seen.tile = radius;
  }
  assert.deepEqual(seen, { button: '8px', tile: '12px' });
  await page.close();
});

test('a wrapped diagram never leaves a connector at the end of a line', async () => {
  const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
  for (const path of ['/', '/projects/strength-in-numbers/']) {
    await page.goto(server.url + path);
    const orphans = await page.evaluate(() => [...document.querySelectorAll('.diagram .edge')].flatMap((edge) => {
      const node = edge.nextElementSibling;
      const [a, b] = [edge.getBoundingClientRect(), node.getBoundingClientRect()];
      return Math.abs((a.top + a.bottom) / 2 - (b.top + b.bottom) / 2) > 4 ? [`${edge.textContent} before ${node.textContent}`] : [];
    }));
    assert.deepEqual(orphans, [], path);
  }
  await page.close();
});
