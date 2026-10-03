# Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Ananke-themed portfolio with a small set of owned Hugo layouts: a light homepage (hero, project tiles with data-driven diagrams, about, skills), case-study pages, and a 404 page. Everything is driven by `data/about.json` and `content/projects/*.md`.

**Architecture:** Hugo 0.166.0 with no theme. One `baseof.html` shell, one homepage layout, one case-study layout, focused partials (`nav`, `footer`, `diagram`, `project-tile`, `placeholder-check`), one shortcode (`decision`), and one stylesheet at `assets/css/site.css` run through Hugo Pipes. Tests are Node's built-in test runner. They build a temporary copy of the site with Hugo and assert on the HTML (`node-html-parser`), and they use Playwright/Chromium for rendered checks (contrast, overflow, TOC highlighting, screenshots).

**Tech Stack:** Hugo 0.166.0 (standard edition), Go templates, plain CSS, Node 22 (`node:test`), `node-html-parser`, `playwright` (Chromium), GitHub Actions + `peaceiris/actions-hugo` / `peaceiris/actions-gh-pages`.

**Spec:** `docs/superpowers/specs/2026-09-27-site-redesign-design.md`. Read it before starting any task.

## Global Constraints

- No employer names anywhere (content, data, markup). The experience model has only `start`, `end`, `role`, `industry`, `summary`. No resume link, no LinkedIn.
- Links: GitHub only. Adding Email must need only a new `links` entry in `data/about.json`.
- No tiny all-caps labels. No `text-transform: uppercase` anywhere.
- Mono font (JetBrains Mono) only for tech tags, at 12px or larger. Code spans in case studies use the body font.
- Solid colors only; no gradients. No orange, no bright aqua or teal.
- No "boxes-everywhere" layout: tags are plain text, not pills; the skills list is a `<dl>`, not cards.
- Light mode only. Every color in `site.css` is a CSS variable defined on `:root`.
- No screenshots or images of projects. Project visuals are diagrams from front matter.
- Tokens (exact): `--primary #1D5F7A`, `--primary-dark #174C62`, `--primary-tint #E6F0F3`, `--secondary #6E2230`, `--secondary-tint #F4E9EA`, `--bg #FAFAF9`, `--surface #FFFFFF`, `--text #18181B`, `--text-body #3F3F46`, `--muted #52525B`, `--subtle #71717A`, `--border #E4E4E7`, `--hairline #EDEDEC`. The plan adds `--on-primary #FFFFFF` for text on filled petrol.
- `--subtle` is used only on `--bg` or `--surface`. It fails AA on both tints (4.17 and 4.07).
- Type: Inter 400/500/600/700; body 15–16px, line-height ~1.6; hero `h1` ~40px desktop and 30px mobile with `letter-spacing: -0.03em`; section headings ~20px, weight 600, sentence case.
- Shape: tiles 12px radius, buttons and diagram boxes 8px. Spacing on a 4px scale.
- Motion: hover only, no transforms, `prefers-reduced-motion` respected.
- WCAG AA: 4.5:1 body text, 3:1 for ≥18.66px bold or ≥24px. Focus ring: 2px solid `--primary` outline.
- Homepage max width ~760px; case-study page ~960px. Breakpoints: 640px (grids stack), 800px (TOC hidden).
- Any string containing `[TODO` is a placeholder. CI builds with `hugo --minify --panicOnWarning`.
- All work on branch `redesign`; nothing deploys until merged to `main`.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Muted or subtle text on a tinted panel** (a label on a fact tile, years on a tint, tags on the featured tile). A reader expects every piece of text to be readable. Owned by Task 9's rendered contrast audit, which checks every visible text node against its real background at 375px and 1280px.
2. **Long unbroken strings at 375px** (`carolisengineering.github.io` as a tile title, a 4-node diagram, long tag lists). A reader expects no horizontal scrolling on a phone. Owned by Task 4 (`overflow-wrap: anywhere` and wrapping diagrams) and Task 9 (a no-horizontal-scroll assertion on every page at both widths).
3. **Malformed project front matter** (a diagram with 2 or 5 nodes, a missing `next` between nodes, a `next` on the last node, an unknown `style`, no `diagram` at all). A reader expects the build to say so rather than silently render a broken diagram. Owned by Task 4: `diagram.html` calls `warnf`, so `--panicOnWarning` blocks the deploy.
4. **Reordering projects by weight**, including a tile-only project (no case study) ending up first. A reader expects the lowest weight to become the wide featured tile, and a tile-only featured project to still link to its repo with "↗". Owned by Task 4.
5. **Optional or unexpected fields** (`now` empty or missing, `lede` missing, `experience` empty, a stray `company` key added to an experience entry). A reader expects no empty pill or heading, and never an employer name on the page. Owned by Task 5 (hero, experience, stray `company`) and Task 6 (`lede` fallback).

---

## File map

```
.gitignore                       + public/, resources/, .hugo_build.lock, node_modules/, screenshots/
.github/workflows/hugo.yml       no submodules, pinned Hugo, --panicOnWarning
hugo.toml                        no theme; description param; TOC levels; disableKinds
package.json                     test deps (node-html-parser, playwright) and npm scripts
layouts/_default/baseof.html     html shell
layouts/index.html               homepage
layouts/404.html                 not-found page
layouts/projects/single.html     case-study page
layouts/partials/nav.html
layouts/partials/footer.html
layouts/partials/diagram.html
layouts/partials/project-tile.html
layouts/partials/placeholder-check.html
layouts/shortcodes/decision.html
assets/css/site.css
static/fonts/*.woff2 + Inter-OFL.txt + JetBrainsMono-OFL.txt
static/favicon.svg
data/about.json
content/_index.md                (unchanged)
content/projects/_index.md       section page, never rendered
content/projects/office-hours.md
content/projects/strength-in-numbers.md
content/projects/this-site.md
tests/helpers.mjs                buildSite(), fillPlaceholders(), frontMatter(), serve()
tests/*.test.mjs
scripts/screenshots.mjs
```

**Deviations from the spec's file list, with reasons:**
- `hugo.toml` gets `disableKinds = ['taxonomy', 'term', 'rss']`. The `tags` front matter would otherwise create `/tags/` pages with no layout. Hugo warns about those, and `--panicOnWarning` turns the warnings into failures.
- `content/projects/_index.md` sets `build: { render: never }`. Without it, Hugo would try to render a `/projects/` list page with no layout, which again causes a warning.
- `package.json`, `tests/`, and `scripts/` hold the verification from spec §10.

---

### Task 1: Branch, housekeeping, and CI workflow

**Files:**
- Delete: `.gitmodules`, `themes/ananke` (submodule), `public/`, `.hugo_build.lock`, `static/css/portfolio.css`, `data/projects.json`, `archetypes/`, `layouts/index.html` (rewritten in Task 2)
- Modify: `.gitignore`, `hugo.toml`, `.github/workflows/hugo.yml`

**Interfaces:**
- Consumes: nothing.
- Produces: a `redesign` branch with no theme, `hugo` 0.166.0 on PATH, and the `hugo.toml` config later tasks rely on (TOC levels 2–2, `params.description`, taxonomies and RSS disabled).

- [ ] **Step 1: Create the branch and commit the design docs**

The spec, notes, PDF, and this plan are untracked. The working tree also has an uncommitted `.gitignore` change (`.superpowers/`).

```bash
cd /Users/carol/code/carolisengineering.github.io
git switch -c redesign
git add .gitignore docs/
git commit -m "docs: add redesign spec, notes, and implementation plan

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 2: Install Hugo and record the version**

```bash
brew install hugo
hugo version
```
Expected: `hugo v0.166.0-… darwin/arm64 …`. If brew installs a different version, use that exact version everywhere this plan says `0.166.0`.

- [ ] **Step 3: Remove the theme submodule and old files**

```bash
git submodule deinit -f themes/ananke
git rm -f themes/ananke
rm -rf .git/modules/themes/ananke
git rm -f .gitmodules
git rm -r -q public
rm -rf public
git rm -q .hugo_build.lock static/css/portfolio.css data/projects.json layouts/index.html
git rm -r -q archetypes
```

- [ ] **Step 4: Replace `.gitignore`**

```
.DS_Store
.superpowers/
public/
resources/
.hugo_build.lock
node_modules/
screenshots/
```

- [ ] **Step 5: Replace `hugo.toml`**

```toml
baseURL = 'https://carolisengineering.github.io/'
locale = 'en-us'
title = 'carolisengineering'
disableKinds = ['taxonomy', 'term', 'rss']

[params]
  description = 'Carol is a software engineer who builds backend systems, infrastructure, and AI agents with real evals behind them.'

[markup.tableOfContents]
  startLevel = 2
  endLevel = 2
  ordered = false
```

- [ ] **Step 6: Replace `.github/workflows/hugo.yml`**

```yaml
name: Deploy Hugo to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: '0.166.0'

      - name: Build
        run: hugo --minify --panicOnWarning

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

- [ ] **Step 7: Verify the cleanup**

```bash
git status --short
test ! -e themes/ananke && test ! -e .gitmodules && test ! -d .git/modules/themes && echo CLEAN
git config --get-regexp '^submodule\.' || echo NO_SUBMODULE_CONFIG
```
Expected: the deletions and three modified files are staged or listed, then `CLEAN` and `NO_SUBMODULE_CONFIG`.

- [ ] **Step 8: Commit (the single housekeeping commit from spec §8)**

```bash
git add -A .gitignore hugo.toml .github/workflows/hugo.yml
git commit -m "chore: remove Ananke theme and build artifacts, pin Hugo in CI

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Test harness and page shell

**Files:**
- Create: `package.json`, `tests/helpers.mjs`, `tests/shell.test.mjs`, `tests/tokens.test.mjs`
- Create: `layouts/_default/baseof.html`, `layouts/partials/nav.html`, `layouts/partials/footer.html`, `layouts/404.html`, `layouts/index.html` (stub), `assets/css/site.css`, `static/favicon.svg`, `static/fonts/*`

**Interfaces:**
- Consumes: `hugo.toml` from Task 1. `data/about.json` still has its old shape here; only `links` and `name` are read.
- Produces:
  - `buildSite({ about?, files?, args? }) → { ok: boolean, log: string, out: string, exists(rel): boolean, read(rel): string, html(rel): HTMLElement }`. The default `about` is `fillPlaceholders`.
  - `fillPlaceholders(value) → value`, which deep-replaces any string containing `[TODO` with `"Filled in"`.
  - `frontMatter(rel) → string`, the `---…---\n` block of a repo file.
  - `readAbout() → object`.
  - `ROOT`, the absolute repo path.
  - `serve(dir) → Promise<{ url, close() }>`.
  - Layout contract: every page has `header > nav`, `main#main`, and `footer`. `body.wide` sets `--page-width: 960px`. `.container` is the centered column. Nav links are exactly `/#projects`, `/#about`, and `links[0].url`.

- [ ] **Step 1: Install test dependencies**

```bash
cat > package.json <<'EOF'
{
  "name": "carolisengineering-site",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test \"tests/**/*.test.mjs\"",
    "screenshots": "node scripts/screenshots.mjs"
  }
}
EOF
npm install --save-dev node-html-parser playwright
npx playwright install chromium
```

- [ ] **Step 2: Write `tests/helpers.mjs`**

```js
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_ENTRIES = ['hugo.toml', 'layouts', 'assets', 'static', 'data', 'content'];

// Replaces every "[TODO…" string so a fixture build has no placeholder warnings.
export function fillPlaceholders(value) {
  if (typeof value === 'string') return value.includes('[TODO') ? 'Filled in' : value;
  if (Array.isArray(value)) return value.map(fillPlaceholders);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillPlaceholders(v)]));
  }
  return value;
}

export function readAbout() {
  return JSON.parse(readFileSync(join(ROOT, 'data/about.json'), 'utf8'));
}

// The "---\n…\n---\n" block at the top of a content file.
export function frontMatter(rel) {
  const text = readFileSync(join(ROOT, rel), 'utf8');
  const end = text.indexOf('\n---', 3);
  return `${text.slice(0, end + 4)}\n`;
}

/**
 * Builds a copy of the site in a temp dir.
 * about: (about) => about, applied to data/about.json (default: fillPlaceholders).
 * files: { 'content/…': 'text' | null } written into (or deleted from) the copy.
 * args:  extra hugo flags, e.g. ['--panicOnWarning', '--minify'].
 */
export function buildSite({ about = fillPlaceholders, files = {}, args = [] } = {}) {
  const tmp = mkdtempSync(join(tmpdir(), 'site-'));
  const src = join(tmp, 'src');
  const out = join(tmp, 'out');
  for (const entry of SITE_ENTRIES) {
    if (existsSync(join(ROOT, entry))) cpSync(join(ROOT, entry), join(src, entry), { recursive: true });
  }
  const aboutPath = join(src, 'data/about.json');
  writeFileSync(aboutPath, JSON.stringify(about(JSON.parse(readFileSync(aboutPath, 'utf8'))), null, 2));
  for (const [rel, content] of Object.entries(files)) {
    const target = join(src, rel);
    if (content === null) {
      rmSync(target, { force: true });
      continue;
    }
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  const result = spawnSync(
    'hugo',
    ['--source', src, '--destination', out, '--cacheDir', join(tmp, 'cache'), ...args],
    { encoding: 'utf8' },
  );
  if (result.error) throw result.error;
  return {
    ok: result.status === 0,
    log: `${result.stdout}\n${result.stderr}`,
    out,
    exists: (rel) => existsSync(join(out, rel)),
    read: (rel) => readFileSync(join(out, rel), 'utf8'),
    html: (rel) => parse(readFileSync(join(out, rel), 'utf8')),
  };
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
};

// Minimal static server for browser tests; unknown paths get 404.html.
export function serve(dir) {
  const server = createServer((req, res) => {
    let file = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.writeHead(404, { 'content-type': TYPES['.html'] });
      res.end(readFileSync(join(dir, '404.html')));
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((done) => {
    server.listen(0, '127.0.0.1', () => {
      done({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() });
    });
  });
}
```

- [ ] **Step 3: Write the failing tests `tests/shell.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, fillPlaceholders } from './helpers.mjs';

const site = buildSite();

test('builds without warnings', () => {
  assert.ok(site.ok, site.log);
  assert.doesNotMatch(site.log, /WARN/, site.log);
});

test('every page has header, nav, main and footer landmarks', () => {
  for (const page of ['index.html', '404.html']) {
    const doc = site.html(page);
    for (const sel of ['header', 'header nav', 'main', 'footer']) {
      assert.ok(doc.querySelector(sel), `${page} is missing ${sel}`);
    }
  }
});

test('nav has the brand, section links, and GitHub', () => {
  const nav = site.html('index.html').querySelector('header nav');
  const brand = nav.querySelector('a.brand');
  assert.equal(brand.getAttribute('href'), '/');
  assert.equal(brand.text.trim(), 'carol.');
  assert.equal(nav.querySelector('.brand-dot').text, '.');
  const links = nav.querySelectorAll('.nav-links a').map((a) => [a.text.trim(), a.getAttribute('href')]);
  assert.deepEqual(links, [
    ['Projects', '/#projects'],
    ['About', '/#about'],
    ['GitHub ↗', 'https://github.com/carolisengineering'],
  ]);
});

test('stylesheet is minified, fingerprinted, and has integrity', () => {
  const link = site.html('index.html').querySelector('link[rel="stylesheet"]');
  const href = link.getAttribute('href');
  assert.match(href, /^\/css\/site\.min\.[0-9a-f]{64}\.css$/);
  assert.match(link.getAttribute('integrity'), /^sha256-/);
  assert.ok(site.exists(href.slice(1)));
});

test('favicon and self-hosted fonts are published with their licenses', () => {
  assert.ok(site.html('index.html').querySelector('link[rel="icon"][href="/favicon.svg"]'));
  for (const file of [
    'favicon.svg',
    'fonts/inter-latin-400-normal.woff2',
    'fonts/inter-latin-500-normal.woff2',
    'fonts/inter-latin-600-normal.woff2',
    'fonts/inter-latin-700-normal.woff2',
    'fonts/jetbrains-mono-latin-400-normal.woff2',
    'fonts/Inter-OFL.txt',
    'fonts/JetBrainsMono-OFL.txt',
  ]) {
    assert.ok(site.exists(file), file);
  }
});

test('footer lists every link and says Built with Hugo', () => {
  const footer = site.html('index.html').querySelector('footer');
  assert.deepEqual(footer.querySelectorAll('a').map((a) => a.getAttribute('href')), ['https://github.com/carolisengineering']);
  assert.match(footer.text, /Built with Hugo/);
});

test('adding an Email link is a data-only change', () => {
  const withEmail = buildSite({
    about: (a) => ({ ...fillPlaceholders(a), links: [...a.links, { label: 'Email', url: 'mailto:hi@example.com' }] }),
  });
  const doc = withEmail.html('index.html');
  assert.ok(doc.querySelector('footer a[href="mailto:hi@example.com"]'));
  assert.equal(doc.querySelectorAll('.nav-links a').length, 3, 'nav shows only GitHub as an external link');
});

test('404 page has a heading and a link home', () => {
  const doc = site.html('404.html');
  assert.equal(doc.querySelector('main h1').text.trim(), 'Page not found');
  assert.ok(doc.querySelector('main a[href="/"]'));
});

test('no theme or old stylesheet leftovers', () => {
  for (const page of ['index.html', '404.html']) {
    assert.doesNotMatch(site.read(page), /ananke|portfolio\.css/i);
  }
});
```

- [ ] **Step 4: Write the failing tests `tests/tokens.test.mjs`**

These cover spec §10 item 3: the contrast of every token pair the stylesheet uses.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './helpers.mjs';

const css = readFileSync(join(ROOT, 'assets/css/site.css'), 'utf8');
const rootBlock = css.match(/:root\s*{([^}]*)}/)[1];
const tokens = Object.fromEntries([...rootBlock.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2].toUpperCase()]));

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('tokens match the spec exactly', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(tokens).filter(([k]) => k !== 'on-primary')),
    {
      primary: '#1D5F7A', 'primary-dark': '#174C62', 'primary-tint': '#E6F0F3',
      secondary: '#6E2230', 'secondary-tint': '#F4E9EA', bg: '#FAFAF9', surface: '#FFFFFF',
      text: '#18181B', 'text-body': '#3F3F46', muted: '#52525B', subtle: '#71717A',
      border: '#E4E4E7', hairline: '#EDEDEC',
    },
  );
  assert.equal(tokens['on-primary'], '#FFFFFF');
});

// [foreground, background] for every text-on-background pair the stylesheet uses. All are body-size text: 4.5:1.
const PAIRS = [
  ['text', 'bg'], ['text', 'surface'], ['text', 'primary-tint'], ['text', 'secondary-tint'],
  ['text-body', 'bg'], ['text-body', 'surface'], ['text-body', 'secondary-tint'],
  ['muted', 'bg'], ['muted', 'surface'], ['muted', 'primary-tint'], ['muted', 'secondary-tint'],
  ['subtle', 'bg'], ['subtle', 'surface'],
  ['primary', 'bg'], ['primary', 'surface'], ['primary', 'primary-tint'], ['primary', 'secondary-tint'],
  ['primary-dark', 'surface'], ['primary-dark', 'primary-tint'],
  ['secondary', 'bg'], ['secondary', 'surface'], ['secondary', 'primary-tint'], ['secondary', 'secondary-tint'],
  ['on-primary', 'primary'], ['on-primary', 'primary-dark'],
];

for (const [fg, bg] of PAIRS) {
  test(`--${fg} on --${bg} meets 4.5:1`, () => {
    const ratio = contrast(tokens[fg], tokens[bg]);
    assert.ok(ratio >= 4.5, `${ratio.toFixed(2)}:1`);
  });
}

test('no gradients, no uppercase labels, and no raw colors outside :root', () => {
  assert.doesNotMatch(css, /gradient\(/);
  assert.doesNotMatch(css, /text-transform:\s*uppercase/);
  const outsideRoot = css.replace(/:root\s*{[^}]*}/, '');
  assert.doesNotMatch(outsideRoot, /#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL. The shell tests fail because Hugo finds no layouts (index.html and 404.html are missing). The token tests fail on `readFileSync` of `assets/css/site.css` (ENOENT).

- [ ] **Step 6: Download fonts and licenses**

```bash
mkdir -p static/fonts
for w in 400 500 600 700; do
  curl -fsSL -o "static/fonts/inter-latin-$w-normal.woff2" \
    "https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-$w-normal.woff2"
done
curl -fsSL -o static/fonts/jetbrains-mono-latin-400-normal.woff2 \
  https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/files/jetbrains-mono-latin-400-normal.woff2
curl -fsSL -o static/fonts/Inter-OFL.txt https://cdn.jsdelivr.net/npm/@fontsource/inter@5/LICENSE
curl -fsSL -o static/fonts/JetBrainsMono-OFL.txt https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/LICENSE
file static/fonts/*.woff2
grep -il "open font license" static/fonts/*.txt
```
Expected: five `Web Open Font Format (Version 2)` files, and both `.txt` files listed. If a LICENSE file isn't the OFL text, get it from the font's upstream repo instead (`rsms/inter` `LICENSE.txt`, `JetBrains/JetBrainsMono` `OFL.txt`).

- [ ] **Step 7: Create `static/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <text x="3" y="25" font-family="Inter, system-ui, sans-serif" font-size="27" font-weight="700" fill="#1D5F7A">c</text>
  <circle cx="24" cy="22" r="3.5" fill="#6E2230"/>
</svg>
```

- [ ] **Step 8: Create `layouts/_default/baseof.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ if .IsHome }}{{ site.Title }}{{ else }}{{ .Title }} · {{ site.Title }}{{ end }}</title>
  <meta name="description" content="{{ with .Params.summary }}{{ . }}{{ else }}{{ site.Params.description }}{{ end }}">
  <link rel="icon" href="{{ "favicon.svg" | relURL }}" type="image/svg+xml">
  {{ with resources.Get "css/site.css" | minify | fingerprint }}
  <link rel="stylesheet" href="{{ .RelPermalink }}" integrity="{{ .Data.Integrity }}">
  {{ end }}
</head>
<body{{ if and .IsPage (eq .Section "projects") }} class="wide"{{ end }}>
  {{ partial "nav.html" . }}
  <main id="main">
    {{ block "main" . }}{{ end }}
  </main>
  {{ partial "footer.html" . }}
</body>
</html>
```

- [ ] **Step 9: Create `layouts/partials/nav.html`**

```html
{{ $about := hugo.Data.about }}
{{ $github := index $about.links 0 }}
<header class="site-header">
  <nav class="container nav" aria-label="Main">
    <a class="brand" href="{{ "/" | relURL }}">{{ lower $about.name }}<span class="brand-dot">.</span></a>
    <ul class="nav-links">
      <li><a href="/#projects">Projects</a></li>
      <li><a href="/#about">About</a></li>
      <li><a href="{{ $github.url }}" rel="noopener">{{ $github.label }} ↗</a></li>
    </ul>
  </nav>
</header>
```

- [ ] **Step 10: Create `layouts/partials/footer.html`**

```html
<footer class="site-footer">
  <div class="container footer-inner">
    <ul class="footer-links">
      {{ range hugo.Data.about.links }}
      <li><a href="{{ .url }}" rel="noopener">{{ .label }}</a></li>
      {{ end }}
    </ul>
    <p>Built with Hugo</p>
  </div>
</footer>
```

- [ ] **Step 11: Create `layouts/404.html` and the stub `layouts/index.html`**

`layouts/404.html`:
```html
{{ define "main" }}
<section class="container not-found">
  <h1>Page not found</h1>
  <p><a href="{{ "/" | relURL }}">← Back home</a></p>
</section>
{{ end }}
```

`layouts/index.html` (stub, replaced in Tasks 3–5):
```html
{{ define "main" }}
<div class="container">
  <section id="projects" class="section"></section>
  <section id="about" class="section"></section>
</div>
{{ end }}
```

- [ ] **Step 12: Create `assets/css/site.css` (base)**

```css
@font-face { font-family: "Inter"; src: url("/fonts/inter-latin-400-normal.woff2") format("woff2"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Inter"; src: url("/fonts/inter-latin-500-normal.woff2") format("woff2"); font-weight: 500; font-style: normal; font-display: swap; }
@font-face { font-family: "Inter"; src: url("/fonts/inter-latin-600-normal.woff2") format("woff2"); font-weight: 600; font-style: normal; font-display: swap; }
@font-face { font-family: "Inter"; src: url("/fonts/inter-latin-700-normal.woff2") format("woff2"); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: "JetBrains Mono"; src: url("/fonts/jetbrains-mono-latin-400-normal.woff2") format("woff2"); font-weight: 400; font-style: normal; font-display: swap; }

:root {
  --primary: #1D5F7A;
  --primary-dark: #174C62;
  --primary-tint: #E6F0F3;
  --secondary: #6E2230;
  --secondary-tint: #F4E9EA;
  --bg: #FAFAF9;
  --surface: #FFFFFF;
  --text: #18181B;
  --text-body: #3F3F46;
  --muted: #52525B;
  --subtle: #71717A;
  --border: #E4E4E7;
  --hairline: #EDEDEC;
  --on-primary: #FFFFFF;

  --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --radius-tile: 12px;
  --radius-box: 8px;
  --page-width: 760px;
}

body.wide { --page-width: 960px; }

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text-body);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.6;
  -webkit-text-size-adjust: 100%;
}

h1, h2, h3 { margin: 0; color: var(--text); line-height: 1.25; }
p { margin: 0; }
a { color: var(--primary); }
a:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; border-radius: 4px; }

.container { max-width: var(--page-width); margin: 0 auto; padding: 0 20px; }

/* Nav */
.nav { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px; padding-top: 24px; padding-bottom: 24px; }
.brand { color: var(--text); font-size: 18px; font-weight: 700; letter-spacing: -0.02em; text-decoration: none; }
.brand-dot { color: var(--secondary); }
.nav-links { display: flex; gap: 20px; margin: 0; padding: 0; list-style: none; font-size: 15px; }
.nav-links a { color: var(--muted); text-decoration: none; transition: color 150ms ease; }
.nav-links a:hover { color: var(--text); }

/* Footer */
.site-footer { margin-top: 80px; padding: 32px 0 48px; border-top: 1px solid var(--hairline); color: var(--muted); font-size: 14px; }
.footer-inner { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; }
.footer-links { display: flex; gap: 16px; margin: 0; padding: 0; list-style: none; }
.footer-links a { color: var(--muted); }

/* 404 */
.not-found { padding-top: 64px; }
.not-found h1 { margin-bottom: 16px; font-size: 30px; letter-spacing: -0.03em; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; }
}
```

- [ ] **Step 13: Run the tests to verify they pass**

Run: `npm test`
Expected: all tests in `shell.test.mjs` and `tokens.test.mjs` PASS.
If "builds without warnings" fails with a Hugo deprecation warning about `_default/` or `partials/` layout paths, move the files to Hugo's newer layout names (`layouts/baseof.html`, `layouts/_partials/`, `layouts/_shortcodes/`) and use those names in every later task. Then run the tests again.

- [ ] **Step 14: Commit**

```bash
git add package.json package-lock.json tests/ layouts/ assets/ static/
git commit -m "feat: add page shell, fonts, tokens, and test harness

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Content model and placeholder check

**Files:**
- Modify: `data/about.json`, `layouts/index.html`
- Create: `content/projects/_index.md`, `content/projects/office-hours.md`, `content/projects/strength-in-numbers.md`, `content/projects/this-site.md`, `layouts/partials/placeholder-check.html`, `layouts/projects/single.html` (stub, replaced in Task 6)
- Test: `tests/content.test.mjs`

**Interfaces:**
- Consumes: `buildSite`, `readAbout` (Task 2).
- Produces:
  - The `about.json` shape: `name, now, headline, headlineHighlight, lede, intro, facts[{value,label}], experience[{start,end,role,industry,summary}], links[{label,url}], skills[{category,items[]}]`.
  - Project front matter: `title, summary, tags[], repo, weight, diagram[{label, style?, next?}], lede?, build?`.
  - `partial "placeholder-check.html" .`, called once from `index.html`. It emits `WARN placeholder not filled: <path> = "<value>"`.

- [ ] **Step 1: Write the failing tests `tests/content.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, readAbout } from './helpers.mjs';

const about = readAbout();

test('about.json has the spec shape and no employer, avatar, or title fields', () => {
  for (const key of ['avatar', 'title', 'bio', 'company']) assert.ok(!(key in about), `unexpected key ${key}`);
  for (const key of ['name', 'headline', 'headlineHighlight', 'lede', 'intro', 'facts', 'experience', 'links', 'skills']) {
    assert.ok(key in about, `missing key ${key}`);
  }
  for (const entry of about.experience) {
    assert.deepEqual(Object.keys(entry).sort(), ['end', 'industry', 'role', 'start', 'summary']);
  }
  assert.ok(about.facts.length >= 1);
  assert.deepEqual(about.links[0], { label: 'GitHub', url: 'https://github.com/carolisengineering' });
});

test('skills keep all nine categories unchanged', () => {
  assert.deepEqual(about.skills.map((s) => s.category), [
    'Languages', 'Frameworks', 'Testing', 'Infrastructure', 'Databases',
    'Message Brokers', 'Observability', 'CI/CD', 'AI Tooling',
  ]);
  assert.deepEqual(about.skills[3].items, ['Kubernetes', 'Docker', 'Azure', 'AWS', 'GCP']);
});

test('unfilled placeholders warn but still render; --panicOnWarning fails', () => {
  const raw = buildSite({ about: (a) => a });
  assert.ok(raw.ok, raw.log);
  assert.match(raw.log, /placeholder not filled: data\/about\.json\.facts\[0\]\.value/);
  assert.match(raw.log, /placeholder not filled: data\/about\.json\.experience\[0\]\.start/);
  const strict = buildSite({ about: (a) => a, args: ['--panicOnWarning'] });
  assert.equal(strict.ok, false);
});

test('a placeholder in project front matter is reported with its file', () => {
  const s = buildSite({
    files: {
      'content/projects/zz-test.md': [
        '---', 'title: zz-test', 'summary: "[TODO summary]"', 'tags: [X]', 'repo: https://example.com/zz',
        'weight: 9', 'build: { render: never, list: always }',
        'diagram:', '  - { label: A, next: "→" }', '  - { label: B, next: "→" }', '  - { label: C }', '---', '',
      ].join('\n'),
    },
  });
  assert.match(s.log, /placeholder not filled: .*zz-test\.md\.summary/);
});

test('a filled site builds clean with the CI flags', () => {
  const s = buildSite({ args: ['--minify', '--panicOnWarning'] });
  assert.ok(s.ok, s.log);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/content.test.mjs`
Expected: FAIL. The shape test fails on `title`, `avatar`, and `bio`. The placeholder tests fail because no warning is emitted.

- [ ] **Step 3: Replace `data/about.json`**

```json
{
  "name": "Carol",
  "now": "Building agent evals",
  "headline": "Software engineer who builds",
  "headlineHighlight": "and explains.",
  "lede": "I solve technical problems with code and communication: backend systems, infrastructure, and AI agents with real evals behind them.",
  "intro": "I build backend systems and the infrastructure under them, and I care as much about explaining them as building them.",
  "facts": [
    { "value": "[TODO years] years", "label": "shipping production software" },
    { "value": "4 languages", "label": "in production: Python, Java, Go, JS" },
    { "value": "3 clouds", "label": "AWS, Azure, GCP, all on Kubernetes" }
  ],
  "experience": [
    { "start": "[TODO]", "end": "now", "role": "Software Engineer", "industry": "[TODO industry]", "summary": "[TODO one line]" }
  ],
  "links": [
    { "label": "GitHub", "url": "https://github.com/carolisengineering" }
  ],
  "skills": [
    { "category": "Languages", "items": ["Python", "Java", "Go", "JavaScript"] },
    { "category": "Frameworks", "items": ["Spring", "FastAPI", "Django", "Fastify"] },
    { "category": "Testing", "items": ["JUnit", "pytest", "testify"] },
    { "category": "Infrastructure", "items": ["Kubernetes", "Docker", "Azure", "AWS", "GCP"] },
    { "category": "Databases", "items": ["MongoDB", "PostgreSQL"] },
    { "category": "Message Brokers", "items": ["RabbitMQ", "Redis", "Azure Service Bus"] },
    { "category": "Observability", "items": ["Grafana", "Prometheus", "New Relic"] },
    { "category": "CI/CD", "items": ["GitHub Actions", "Jenkins", "Harness"] },
    { "category": "AI Tooling", "items": ["Claude Code", "GitHub Copilot", "Cursor"] }
  ]
}
```

- [ ] **Step 4: Create the project content files**

`content/projects/_index.md`:
```markdown
---
title: Projects
build:
  render: never
---
```

`content/projects/office-hours.md`:
```markdown
---
title: office-hours
summary: Student-support agent grounded in a program knowledge base, built on the Claude Agent SDK.
tags: [Python, Claude Agent SDK, RAG, Evals, Langfuse, Red-teaming]
repo: https://github.com/carolisengineering/office-hours
weight: 1
diagram:
  - { label: Student question, next: "→" }
  - { label: Agent, style: primary, next: "⇄" }
  - { label: Knowledge base, next: "→" }
  - { label: Evals, style: secondary }
---

## The problem

[TODO draft]

## What I built

[TODO draft]

## How it works

[TODO draft]

## Decisions & tradeoffs

[TODO draft]

## Results & evals

[TODO draft]

## What I'd do next

[TODO draft]
```

`content/projects/strength-in-numbers.md`:
```markdown
---
title: strength-in-numbers
summary: Mobile-first workout logging and progress tracking web app.
tags: [TypeScript, Fastify, Prisma, PostgreSQL, Docker]
repo: https://github.com/carolisengineering/strength-in-numbers
weight: 2
diagram:
  - { label: React SPA, next: "→" }
  - { label: Fastify API, style: primary, next: "→" }
  - { label: Domain core, next: "→" }
  - { label: PostgreSQL, style: secondary }
---

## The problem

[TODO draft]

## What I built

[TODO draft]

## How it works

[TODO draft]

## Decisions & tradeoffs

[TODO draft]

## Results & evals

[TODO draft]

## What I'd do next

[TODO draft]
```

`content/projects/this-site.md`:
```markdown
---
title: carolisengineering.github.io
summary: "This site: a portfolio built with Hugo and deployed to GitHub Pages by GitHub Actions."
tags: [Hugo, GitHub Actions]
repo: https://github.com/carolisengineering/carolisengineering.github.io
weight: 3
build:
  render: never
  list: always
diagram:
  - { label: Markdown + JSON, next: "→" }
  - { label: Hugo, style: primary, next: "→" }
  - { label: GitHub Actions, next: "→" }
  - { label: GitHub Pages, style: secondary }
---
```

- [ ] **Step 5: Create `layouts/partials/placeholder-check.html`**

```html
{{- /*
  Called with the home page: walks about.json and every project's front matter.
  Calls itself with (dict "value" … "walkPath" …) to recurse. Each string containing
  "[TODO" becomes one warning, so `--panicOnWarning` blocks a deploy with placeholders.
*/ -}}
{{- if and (reflect.IsMap .) (isset . "walkPath") -}}
  {{- $v := .value -}}
  {{- $path := .walkPath -}}
  {{- if reflect.IsMap $v -}}
    {{- range $k, $x := $v -}}
      {{- partial "placeholder-check.html" (dict "value" $x "walkPath" (printf "%s.%s" $path $k)) -}}
    {{- end -}}
  {{- else if reflect.IsSlice $v -}}
    {{- range $i, $x := $v -}}
      {{- partial "placeholder-check.html" (dict "value" $x "walkPath" (printf "%s[%d]" $path $i)) -}}
    {{- end -}}
  {{- else if and (eq (printf "%T" $v) "string") (strings.Contains $v "[TODO") -}}
    {{- warnf "placeholder not filled: %s = %q" $path $v -}}
  {{- end -}}
{{- else -}}
  {{- partial "placeholder-check.html" (dict "value" hugo.Data.about "walkPath" "data/about.json") -}}
  {{- range where site.RegularPages "Section" "projects" -}}
    {{- partial "placeholder-check.html" (dict "value" .Params "walkPath" .File.Path) -}}
  {{- end -}}
{{- end -}}
```

- [ ] **Step 6: Call it from `layouts/index.html` and add the stub case-study layout**

`layouts/index.html`:
```html
{{ define "main" }}
{{ partial "placeholder-check.html" . }}
<div class="container">
  <section id="projects" class="section"></section>
  <section id="about" class="section"></section>
</div>
{{ end }}
```

`layouts/projects/single.html` (stub so the pages render without warnings; replaced in Task 6):
```html
{{ define "main" }}
<article class="container">
  <h1>{{ .Title }}</h1>
  {{ .Content }}
</article>
{{ end }}
```

- [ ] **Step 7: Run all tests**

Run: `npm test`
Expected: all PASS. The nav tests from Task 2 still pass with the new `about.json`.

- [ ] **Step 8: Commit**

```bash
git add data/about.json content/projects layouts tests/content.test.mjs
git commit -m "feat: add content model, project files, and placeholder warnings

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Diagrams and project tiles

**Files:**
- Create: `layouts/partials/diagram.html`, `layouts/partials/project-tile.html`
- Modify: `layouts/index.html`, `assets/css/site.css` (append)
- Test: `tests/projects.test.mjs`

**Interfaces:**
- Consumes: project front matter (Task 3); `buildSite`, `frontMatter`, `readFileSync`/`ROOT` (Task 2).
- Produces:
  - `partial "diagram.html" (dict "nodes" <[]node> "size" "compact"|"large" "name" <string>)` renders `div.diagram.diagram--<size>[role=img][aria-label="A to B to C"]` containing `span.node(.node--primary|.node--secondary)` and `span.edge[aria-hidden=true]`. It warns on 2 or fewer nodes, 5 or more nodes, a missing or extra `next`, or an unknown `style`.
  - `partial "project-tile.html" (dict "page" <Page> "index" <int>)` renders `a.tile(.tile--featured)` with `.tile-diagram(.panel--primary|.panel--secondary)`, `.tile-title > .tile-name + .arrow`, `.tile-summary` (featured only), and `ul.tags`.
  - CSS classes `.panel--primary` and `.panel--secondary` (reused by Task 6), plus `.tags` and `.section`.

- [ ] **Step 1: Write the failing tests `tests/projects.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSite, frontMatter, ROOT } from './helpers.mjs';

const site = buildSite();
const tiles = () => site.html('index.html').querySelectorAll('#projects .tiles > a.tile');
const name = (tile) => tile.querySelector('.tile-name').text.trim();

test('tiles are ordered by weight and the first is the wide featured tile', () => {
  const t = tiles();
  assert.deepEqual(t.map(name), ['office-hours', 'strength-in-numbers', 'carolisengineering.github.io']);
  assert.deepEqual(t.map((x) => x.classList.contains('tile--featured')), [true, false, false]);
});

test('only the featured tile shows the summary', () => {
  const t = tiles();
  assert.match(t[0].querySelector('.tile-summary').text, /Student-support agent/);
  assert.equal(t[1].querySelector('.tile-summary'), null);
  assert.equal(t[2].querySelector('.tile-summary'), null);
});

test('case-study tiles link with →, tile-only projects link to the repo with ↗', () => {
  const t = tiles();
  assert.deepEqual(t.map((x) => [x.getAttribute('href'), x.querySelector('.arrow').text]), [
    ['/projects/office-hours/', '→'],
    ['/projects/strength-in-numbers/', '→'],
    ['https://github.com/carolisengineering/carolisengineering.github.io', '↗'],
  ]);
  assert.equal(site.exists('projects/this-site/index.html'), false);
  assert.equal(site.exists('projects/index.html'), false);
  assert.equal(site.exists('tags/index.html'), false);
});

test('non-featured diagram panels alternate petrol then maroon tint', () => {
  const panels = tiles().map((x) => x.querySelector('.tile-diagram').classList);
  assert.equal(panels[0].contains('panel--primary') || panels[0].contains('panel--secondary'), false);
  assert.ok(panels[1].contains('panel--primary'));
  assert.ok(panels[2].contains('panel--secondary'));
});

test('diagram renders nodes, styles, connectors, and a readable aria-label', () => {
  const d = tiles()[0].querySelector('.diagram');
  assert.ok(d.classList.contains('diagram--compact'));
  assert.equal(d.getAttribute('role'), 'img');
  assert.equal(d.getAttribute('aria-label'), 'Student question to Agent to Knowledge base to Evals');
  assert.deepEqual(d.querySelectorAll('.node').map((n) => [n.text.trim(), n.getAttribute('class')]), [
    ['Student question', 'node'],
    ['Agent', 'node node--primary'],
    ['Knowledge base', 'node'],
    ['Evals', 'node node--secondary'],
  ]);
  assert.deepEqual(d.querySelectorAll('.edge').map((e) => e.text.trim()), ['→', '⇄', '→']);
  assert.ok(d.querySelectorAll('.edge').every((e) => e.getAttribute('aria-hidden') === 'true'));
});

test('tags render as a list', () => {
  const tags = tiles()[0].querySelectorAll('.tags li').map((li) => li.text.trim());
  assert.deepEqual(tags, ['Python', 'Claude Agent SDK', 'RAG', 'Evals', 'Langfuse', 'Red-teaming']);
});

test('changing weights changes the featured tile, even to a tile-only project', () => {
  const thisSite = readFileSync(join(ROOT, 'content/projects/this-site.md'), 'utf8').replace('weight: 3', 'weight: -1');
  const s = buildSite({ files: { 'content/projects/this-site.md': thisSite } });
  const first = s.html('index.html').querySelector('#projects .tiles > a.tile');
  assert.ok(first.classList.contains('tile--featured'));
  assert.equal(first.getAttribute('href'), 'https://github.com/carolisengineering/carolisengineering.github.io');
  assert.equal(first.querySelector('.arrow').text, '↗');
});

function projectWithDiagram(lines) {
  return {
    'content/projects/zz-bad.md': [
      '---', 'title: zz-bad', 'summary: s', 'tags: [X]', 'repo: https://example.com/zz', 'weight: 9',
      'build: { render: never, list: always }', ...lines, '---', '',
    ].join('\n'),
  };
}

for (const [label, lines, message] of [
  ['too few nodes', ['diagram:', '  - { label: A, next: "→" }', '  - { label: B }'], /zz-bad has 2 nodes/],
  ['too many nodes', ['diagram:', ...['A', 'B', 'C', 'D'].map((l) => `  - { label: ${l}, next: "→" }`), '  - { label: E }'], /zz-bad has 5 nodes/],
  ['missing diagram', [], /zz-bad has 0 nodes/],
  ['missing next', ['diagram:', '  - { label: A, next: "→" }', '  - { label: B }', '  - { label: C }'], /node "B" needs a next/],
  ['next on last node', ['diagram:', '  - { label: A, next: "→" }', '  - { label: B, next: "→" }', '  - { label: C, next: "→" }'], /last node "C"/],
  ['unknown style', ['diagram:', '  - { label: A, style: bold, next: "→" }', '  - { label: B, next: "→" }', '  - { label: C }'], /unknown style "bold"/],
]) {
  test(`malformed diagram warns: ${label}`, () => {
    const s = buildSite({ files: projectWithDiagram(lines) });
    assert.match(s.log, message, s.log);
    assert.equal(buildSite({ files: projectWithDiagram(lines), args: ['--panicOnWarning'] }).ok, false);
  });
}

test('the real projects build clean', () => {
  assert.ok(buildSite({ args: ['--panicOnWarning'] }).ok);
  assert.ok(frontMatter('content/projects/office-hours.md').startsWith('---\n'));
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/projects.test.mjs`
Expected: FAIL. `#projects .tiles` doesn't exist yet, and there are no diagram warnings.

- [ ] **Step 3: Create `layouts/partials/diagram.html`**

```html
{{- /* Architecture diagram from front matter. Warns on malformed data so --panicOnWarning blocks a deploy. */ -}}
{{- $nodes := .nodes | default slice -}}
{{- $count := len $nodes -}}
{{- if or (lt $count 3) (gt $count 4) -}}
  {{- warnf "diagram for %s has %d nodes; it needs 3–4" .name $count -}}
{{- end -}}
{{- $labels := slice -}}
{{- range $i, $node := $nodes -}}
  {{- $labels = $labels | append $node.label -}}
  {{- $last := eq (add $i 1) $count -}}
  {{- if and (not $last) (not $node.next) -}}
    {{- warnf "diagram for %s: node %q needs a next connector" $.name $node.label -}}
  {{- end -}}
  {{- if and $last $node.next -}}
    {{- warnf "diagram for %s: last node %q must not have next" $.name $node.label -}}
  {{- end -}}
  {{- with $node.style -}}
    {{- if not (in (slice "primary" "secondary") .) -}}
      {{- warnf "diagram for %s: unknown style %q on node %q" $.name . $node.label -}}
    {{- end -}}
  {{- end -}}
{{- end -}}
<div class="diagram diagram--{{ .size }}" role="img" aria-label="{{ delimit $labels " to " }}">
  {{- range $nodes }}
  <span class="node{{ with .style }} node--{{ . }}{{ end }}">{{ .label }}</span>
  {{- with .next }}
  <span class="edge" aria-hidden="true">{{ . }}</span>
  {{- end }}
  {{- end }}
</div>
```

- [ ] **Step 4: Create `layouts/partials/project-tile.html`**

```html
{{- $p := .page -}}
{{- $featured := eq .index 0 -}}
{{- $href := $p.RelPermalink -}}
{{- $arrow := "→" -}}
{{- if not $href -}}
  {{- $href = $p.Params.repo -}}
  {{- $arrow = "↗" -}}
{{- end -}}
{{- /* Non-featured tiles alternate diagram panels: index 1 petrol, 2 maroon, 3 petrol… */ -}}
{{- $panel := cond (modBool .index 2) "panel--secondary" "panel--primary" -}}
<a class="tile{{ if $featured }} tile--featured{{ end }}" href="{{ $href }}"{{ if eq $arrow "↗" }} rel="noopener"{{ end }}>
  <div class="tile-diagram{{ if not $featured }} {{ $panel }}{{ end }}">
    {{ partial "diagram.html" (dict "nodes" $p.Params.diagram "size" "compact" "name" $p.Title) }}
  </div>
  <h3 class="tile-title"><span class="tile-name">{{ $p.Title }}</span> <span class="arrow" aria-hidden="true">{{ $arrow }}</span></h3>
  {{- if $featured }}
  <p class="tile-summary">{{ $p.Params.summary }}</p>
  {{- end }}
  <ul class="tags" aria-label="Tech">
    {{- range $p.Params.tags }}
    <li>{{ . }}</li>
    {{- end }}
  </ul>
</a>
```

- [ ] **Step 5: Update `layouts/index.html`**

```html
{{ define "main" }}
{{ partial "placeholder-check.html" . }}
<div class="container">
  <section id="projects" class="section" aria-labelledby="projects-title">
    <h2 id="projects-title">Projects</h2>
    <div class="tiles">
      {{- range $i, $p := (where site.RegularPages "Section" "projects").ByWeight }}
      {{ partial "project-tile.html" (dict "page" $p "index" $i) }}
      {{- end }}
    </div>
  </section>
  <section id="about" class="section"></section>
</div>
{{ end }}
```

- [ ] **Step 6: Append the tile and diagram styles to `assets/css/site.css`**

```css
/* Sections */
.section { padding-top: 64px; }
.section > h2 { margin-bottom: 20px; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }

/* Project tiles */
.tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.tile {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-tile);
  background: var(--surface);
  color: inherit;
  text-decoration: none;
  transition: border-color 150ms ease;
}
.tile:hover { border-color: var(--primary); }
.tile--featured { grid-column: 1 / -1; border-color: var(--primary-tint); background: var(--primary-tint); }
.tile--featured:hover { border-color: var(--primary); }
.tile-diagram { border-radius: var(--radius-box); }
.tile-diagram.panel--primary, .tile-diagram.panel--secondary { padding: 16px; }
.panel--primary { background: var(--primary-tint); }
.panel--secondary { background: var(--secondary-tint); }
.tile-title { font-size: 17px; font-weight: 600; }
.tile-name { overflow-wrap: anywhere; }
.arrow { color: var(--secondary); }
.tile-summary { color: var(--muted); font-size: 15px; }

/* Tech tags: the only mono text on the site */
.tags { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 0; padding: 0; list-style: none; color: var(--primary-dark); font-family: var(--font-mono); font-size: 12px; }

/* Diagrams */
.diagram { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.node {
  padding: 6px 10px;
  border: 1.5px solid var(--primary);
  border-radius: var(--radius-box);
  background: var(--surface);
  color: var(--primary);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
}
.node--primary { background: var(--primary); color: var(--on-primary); }
.node--secondary { border-color: var(--secondary); color: var(--secondary); }
.edge { color: var(--secondary); font-size: 14px; }
.diagram--large { justify-content: center; gap: 12px; }
.diagram--large .node { padding: 10px 16px; font-size: 15px; }
.diagram--large .edge { font-size: 18px; }

@media (max-width: 640px) {
  .tiles { grid-template-columns: 1fr; }
}
```

- [ ] **Step 7: Run all tests**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add layouts assets/css/site.css tests/projects.test.mjs
git commit -m "feat: render project tiles with data-driven diagrams

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Hero, about, experience, and skills

**Files:**
- Modify: `layouts/index.html` (final version), `assets/css/site.css` (append)
- Test: `tests/home.test.mjs`

**Interfaces:**
- Consumes: `about.json` shape (Task 3); `project-tile.html` (Task 4); `buildSite`, `fillPlaceholders` (Task 2).
- Produces: `section.hero` (`.now-pill`, `h1 > .highlight`, `.lede`, `.hero-actions > a.button(.button--primary)`), `#about` (`.intro`, `ul.facts > li.fact.fact--primary|fact--secondary`, `ol.timeline > li.timeline-row`), and `#skills > dl.skills`. The class `.lede` is reused by Task 6.

- [ ] **Step 1: Write the failing tests `tests/home.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, fillPlaceholders, readAbout } from './helpers.mjs';

const about = fillPlaceholders(readAbout());
const doc = buildSite().html('index.html');
const squash = (s) => s.replace(/\s+/g, ' ').trim();
const withAbout = (change) => buildSite({ about: (a) => change(fillPlaceholders(a)) }).html('index.html');

test('hero shows the now pill, headline with maroon highlight, and lede', () => {
  assert.equal(doc.querySelector('.hero .now-pill').text.trim(), 'Building agent evals');
  const h1 = doc.querySelector('.hero h1');
  assert.equal(squash(h1.text), 'Software engineer who builds and explains.');
  assert.equal(h1.querySelector('.highlight').text.trim(), 'and explains.');
  assert.match(doc.querySelector('.hero .lede').text, /^I solve technical problems/);
});

test('an empty or missing now hides the pill', () => {
  assert.equal(withAbout((a) => ({ ...a, now: '' })).querySelector('.now-pill'), null);
  assert.equal(withAbout(({ now, ...a }) => a).querySelector('.now-pill'), null);
});

test('hero buttons: See projects, then one per link (Email appears when added)', () => {
  const buttons = (d) => d.querySelectorAll('.hero-actions a.button').map((a) => [a.text.trim(), a.getAttribute('href')]);
  assert.deepEqual(buttons(doc), [['See projects', '#projects'], ['GitHub', 'https://github.com/carolisengineering']]);
  assert.ok(doc.querySelector('.hero-actions a.button--primary[href="#projects"]'));
  const email = withAbout((a) => ({ ...a, links: [...a.links, { label: 'Email', url: 'mailto:hi@example.com' }] }));
  assert.deepEqual(buttons(email).at(-1), ['Email', 'mailto:hi@example.com']);
});

test('facts render every entry with alternating tints', () => {
  const kinds = (d) => d.querySelectorAll('#about .facts > li.fact')
    .map((li) => (li.classList.contains('fact--primary') ? 'p' : li.classList.contains('fact--secondary') ? 's' : '?'));
  assert.deepEqual(kinds(doc), ['p', 's', 'p']);
  const five = withAbout((a) => ({ ...a, facts: [1, 2, 3, 4, 5].map((n) => ({ value: `v${n}`, label: `l${n}` })) }));
  assert.deepEqual(kinds(five), ['p', 's', 'p', 's', 'p']);
  assert.deepEqual(five.querySelectorAll('.fact-value').map((v) => v.text.trim()), ['v1', 'v2', 'v3', 'v4', 'v5']);
  assert.equal(squash(doc.querySelectorAll('.fact-label')[1].text), about.facts[1].label);
});

test('experience timeline shows years, role · industry, and summary', () => {
  const two = withAbout((a) => ({
    ...a,
    experience: [
      { start: '2022', end: 'now', role: 'Software Engineer', industry: 'EdTech', summary: 'Built things.' },
      { start: '2019', end: '2022', role: 'Developer', industry: 'Logistics', summary: 'Shipped things.' },
    ],
  }));
  const rows = two.querySelectorAll('#about .timeline > li.timeline-row');
  assert.equal(rows.length, 2);
  assert.equal(squash(rows[0].querySelector('.timeline-years').text), '2022 – now');
  assert.equal(squash(rows[0].querySelector('.timeline-role').text), 'Software Engineer · EdTech');
  assert.equal(rows[0].querySelector('.industry').text.trim(), 'EdTech');
  assert.equal(rows[1].querySelector('.timeline-summary').text.trim(), 'Shipped things.');
});

test('an empty experience list hides the Experience heading', () => {
  const none = withAbout((a) => ({ ...a, experience: [] }));
  assert.equal(none.querySelector('#about .subheading'), null);
  assert.equal(none.querySelector('.timeline'), null);
});

test('a stray company field is never rendered', () => {
  const leaked = withAbout((a) => ({
    ...a,
    experience: a.experience.map((e) => ({ ...e, company: 'Acme Employer Inc' })),
  }));
  assert.doesNotMatch(leaked.toString(), /Acme Employer Inc/);
});

test('skills render as a definition list in data order', () => {
  const rows = doc.querySelectorAll('#skills dl.skills dt');
  assert.deepEqual(rows.map((dt) => dt.text.trim()), about.skills.map((s) => s.category));
  assert.equal(doc.querySelectorAll('#skills dl.skills dd')[0].text.trim(), 'Python, Java, Go, JavaScript');
});

test('section headings are sentence case and in order', () => {
  assert.deepEqual(doc.querySelectorAll('main h2').map((h) => h.text.trim()), ['Projects', 'About', 'Skills']);
  assert.equal(doc.querySelectorAll('main h1').length, 1);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/home.test.mjs`
Expected: FAIL. `.hero` doesn't exist yet.

- [ ] **Step 3: Replace `layouts/index.html` (final)**

```html
{{ define "main" }}
{{ partial "placeholder-check.html" . }}
{{ $about := hugo.Data.about }}
<div class="container">
  <section class="hero" aria-labelledby="hero-title">
    {{- with $about.now }}
    <p class="now-pill">{{ . }}</p>
    {{- end }}
    <h1 id="hero-title">{{ $about.headline }} <span class="highlight">{{ $about.headlineHighlight }}</span></h1>
    <p class="lede">{{ $about.lede }}</p>
    <div class="hero-actions">
      <a class="button button--primary" href="#projects">See projects</a>
      {{- range $about.links }}
      <a class="button" href="{{ .url }}" rel="noopener">{{ .label }}</a>
      {{- end }}
    </div>
  </section>

  <section id="projects" class="section" aria-labelledby="projects-title">
    <h2 id="projects-title">Projects</h2>
    <div class="tiles">
      {{- range $i, $p := (where site.RegularPages "Section" "projects").ByWeight }}
      {{ partial "project-tile.html" (dict "page" $p "index" $i) }}
      {{- end }}
    </div>
  </section>

  <section id="about" class="section" aria-labelledby="about-title">
    <h2 id="about-title">About</h2>
    <p class="intro">{{ $about.intro }}</p>
    {{- with $about.facts }}
    <ul class="facts">
      {{- range $i, $f := . }}
      <li class="fact {{ cond (modBool $i 2) "fact--primary" "fact--secondary" }}">
        <span class="fact-value">{{ $f.value }}</span>
        <span class="fact-label">{{ $f.label }}</span>
      </li>
      {{- end }}
    </ul>
    {{- end }}
    {{- with $about.experience }}
    <h3 class="subheading">Experience</h3>
    <ol class="timeline">
      {{- range . }}
      <li class="timeline-row">
        <span class="timeline-years">{{ .start }} – {{ .end }}</span>
        <div>
          <p class="timeline-role">{{ .role }} · <span class="industry">{{ .industry }}</span></p>
          <p class="timeline-summary">{{ .summary }}</p>
        </div>
      </li>
      {{- end }}
    </ol>
    {{- end }}
  </section>

  <section id="skills" class="section" aria-labelledby="skills-title">
    <h2 id="skills-title">Skills</h2>
    <dl class="skills">
      {{- range $about.skills }}
      <div class="skill-row">
        <dt>{{ .category }}</dt>
        <dd>{{ delimit .items ", " }}</dd>
      </div>
      {{- end }}
    </dl>
  </section>
</div>
{{ end }}
```

- [ ] **Step 4: Append the hero, about, and skills styles to `assets/css/site.css`**

```css
/* Hero */
.hero { padding-top: 48px; }
.now-pill { display: inline-block; margin-bottom: 20px; padding: 4px 12px; border-radius: 999px; background: var(--secondary-tint); color: var(--secondary); font-size: 14px; font-weight: 500; }
.hero h1 { font-size: 40px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.15; }
.highlight { color: var(--secondary); }
.lede { margin-top: 16px; max-width: 60ch; color: var(--muted); font-size: 17px; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
.button {
  display: inline-block;
  padding: 10px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-box);
  background: var(--surface);
  color: var(--text);
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition: border-color 150ms ease, background-color 150ms ease;
}
.button:hover { border-color: var(--muted); }
.button--primary { border-color: var(--primary); background: var(--primary); color: var(--on-primary); }
.button--primary:hover { border-color: var(--primary-dark); background: var(--primary-dark); }

/* About */
.intro { max-width: 65ch; }
.facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin: 24px 0 0; padding: 0; list-style: none; }
.fact { display: flex; flex-direction: column; gap: 4px; padding: 16px; border-radius: var(--radius-tile); }
.fact--primary { background: var(--primary-tint); }
.fact--secondary { background: var(--secondary-tint); }
.fact-value { color: var(--text); font-size: 20px; font-weight: 600; letter-spacing: -0.02em; }
.fact-label { color: var(--muted); font-size: 14px; line-height: 1.45; }
.subheading { margin: 40px 0 12px; font-size: 17px; font-weight: 600; }
.timeline { margin: 0; padding: 0; list-style: none; }
.timeline-row { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 16px; padding: 14px 0; border-top: 1px solid var(--hairline); }
.timeline-row:last-child { border-bottom: 1px solid var(--hairline); }
.timeline-years { color: var(--subtle); font-size: 14px; }
.timeline-role { color: var(--text); font-weight: 500; }
.industry { color: var(--primary); }
.timeline-summary { color: var(--muted); font-size: 15px; }

/* Skills */
.skills { margin: 0; }
.skill-row { display: grid; grid-template-columns: 160px minmax(0, 1fr); gap: 16px; padding: 8px 0; }
.skills dt { color: var(--subtle); font-size: 15px; }
.skills dd { margin: 0; }

@media (max-width: 640px) {
  .hero h1 { font-size: 30px; }
  .facts { grid-template-columns: 1fr; }
  .timeline-row, .skill-row { grid-template-columns: 1fr; gap: 2px; }
}
```

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add layouts/index.html assets/css/site.css tests/home.test.mjs
git commit -m "feat: add hero, about, experience, and skills to the homepage

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Case-study page, decision callout, and TOC

**Files:**
- Modify: `layouts/projects/single.html` (final), `assets/css/site.css` (append)
- Create: `layouts/shortcodes/decision.html`
- Test: `tests/case-study.test.mjs`

**Interfaces:**
- Consumes: `diagram.html`, `.panel--primary`, `.tags`, `.lede` (Tasks 4–5); `buildSite`, `frontMatter` (Task 2).
- Produces: `.cs-header` (`a.back-link`, `h1`, `.lede`, `ul.tags`, `a.repo-link`), `.cs-hero.panel--primary > .diagram--large`, `.cs-body > aside.toc > nav#TableOfContents` plus `.cs-article`, `aside.decision > strong`, and the TOC script, which adds `.is-active` to `.toc a`. Task 9 relies on `.is-active`.

- [ ] **Step 1: Write the failing tests `tests/case-study.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, frontMatter } from './helpers.mjs';

const FM = 'content/projects/office-hours.md';
const BODY = [
  '## The problem', '', 'P.', '',
  '## What I built', '', 'P.', '',
  '### A subsection', '', 'Not in the TOC.', '',
  '## How it works', '', 'P.', '',
  '## Decisions & tradeoffs', '', '{{< decision >}}Use **BM25** before embeddings.{{< /decision >}}', '',
  '## Results & evals', '', 'P.', '',
  "## What I'd do next", '', 'P.', '',
].join('\n');

const site = buildSite({ files: { [FM]: frontMatter(FM) + BODY } });
const doc = site.html('projects/office-hours/index.html');

test('header: back link, title, lede falls back to summary, tags, repo', () => {
  const back = doc.querySelector('.cs-header a.back-link');
  assert.equal(back.getAttribute('href'), '/#projects');
  assert.equal(back.text.trim(), '← All projects');
  assert.equal(doc.querySelector('.cs-header h1').text.trim(), 'office-hours');
  assert.match(doc.querySelector('.cs-header .lede').text, /^Student-support agent/);
  assert.equal(doc.querySelectorAll('.cs-header .tags li').length, 6);
  const repo = doc.querySelector('.cs-header a.repo-link');
  assert.equal(repo.getAttribute('href'), 'https://github.com/carolisengineering/office-hours');
  assert.equal(repo.text.trim(), 'Repo ↗');
});

test('an explicit lede wins over summary', () => {
  const fm = frontMatter(FM).replace('\n---\n', '\nlede: A custom lede.\n---\n');
  const d = buildSite({ files: { [FM]: fm + BODY } }).html('projects/office-hours/index.html');
  assert.equal(d.querySelector('.cs-header .lede').text.trim(), 'A custom lede.');
});

test('diagram hero is large on a petrol-tint panel', () => {
  const d = doc.querySelector('.cs-hero.panel--primary .diagram.diagram--large');
  assert.equal(d.getAttribute('aria-label'), 'Student question to Agent to Knowledge base to Evals');
});

test('TOC lists only ## headings and links to their ids', () => {
  const links = doc.querySelectorAll('.cs-body aside.toc a');
  const ids = doc.querySelectorAll('.cs-article h2').map((h) => `#${h.getAttribute('id')}`);
  assert.equal(links.length, 6);
  assert.deepEqual(links.map((a) => a.getAttribute('href')), ids);
  assert.ok(!links.some((a) => /subsection/i.test(a.text)));
});

test('decision shortcode renders a callout with markdown inside', () => {
  const callout = doc.querySelector('.cs-article aside.decision');
  assert.equal(callout.querySelector('strong').text.trim(), 'Key decision:');
  assert.match(callout.innerHTML, /<strong>BM25<\/strong>/);
});

test('page is wide and ships the TOC highlight script', () => {
  assert.ok(doc.querySelector('body.wide'));
  assert.match(doc.querySelector('script').text, /IntersectionObserver/);
  assert.match(site.read('projects/office-hours/index.html'), /<title>office-hours · carolisengineering<\/title>/);
});

test('homepage and 404 are not wide', () => {
  assert.equal(site.html('index.html').querySelector('body.wide'), null);
  assert.equal(site.html('404.html').querySelector('body.wide'), null);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/case-study.test.mjs`
Expected: FAIL. `.cs-header` doesn't exist yet, and the `decision` shortcode is missing, so Hugo errors.

- [ ] **Step 3: Create `layouts/shortcodes/decision.html`**

```html
<aside class="decision"><strong>Key decision:</strong> {{ .Inner | strings.TrimSpace | .Page.RenderString }}</aside>
```

- [ ] **Step 4: Replace `layouts/projects/single.html`**

```html
{{ define "main" }}
<article class="container case-study">
  <header class="cs-header">
    <p><a class="back-link" href="/#projects">← All projects</a></p>
    <h1>{{ .Title }}</h1>
    <p class="lede">{{ .Params.lede | default .Params.summary }}</p>
    <ul class="tags" aria-label="Tech">
      {{- range .Params.tags }}
      <li>{{ . }}</li>
      {{- end }}
    </ul>
    {{- with .Params.repo }}
    <p><a class="repo-link" href="{{ . }}" rel="noopener">Repo ↗</a></p>
    {{- end }}
  </header>

  <div class="cs-hero panel--primary">
    {{ partial "diagram.html" (dict "nodes" .Params.diagram "size" "large" "name" .Title) }}
  </div>

  <div class="cs-body">
    <aside class="toc" aria-label="On this page">{{ .TableOfContents }}</aside>
    <div class="cs-article">{{ .Content }}</div>
  </div>
</article>
<script>
  (() => {
    const links = new Map();
    document.querySelectorAll('.toc a[href^="#"]').forEach((a) => {
      links.set(decodeURIComponent(a.getAttribute('href').slice(1)), a);
    });
    if (!links.size || !('IntersectionObserver' in window)) return;
    const setActive = (id) => links.forEach((a, key) => a.classList.toggle('is-active', key === id));
    // A heading becomes active once it enters the top 30% of the viewport.
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) setActive(visible[0].target.id);
    }, { rootMargin: '0px 0px -70% 0px' });
    links.forEach((_, id) => {
      const heading = document.getElementById(id);
      if (heading) observer.observe(heading);
    });
  })();
</script>
{{ end }}
```

- [ ] **Step 5: Append the case-study styles to `assets/css/site.css`**

```css
/* Case study */
.cs-header { display: flex; flex-direction: column; gap: 12px; padding-top: 32px; }
.cs-header .lede { margin-top: 0; }
.cs-header h1 { font-size: 40px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.15; overflow-wrap: anywhere; }
.back-link, .repo-link { font-size: 15px; font-weight: 500; text-decoration: none; }
.back-link:hover, .repo-link:hover { text-decoration: underline; }
.cs-hero { margin-top: 32px; padding: 40px 24px; border-radius: var(--radius-tile); }
.cs-body { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 48px; margin-top: 48px; }
.toc { position: sticky; top: 24px; align-self: start; font-size: 14px; }
.toc ul { margin: 0; padding: 0; list-style: none; }
.toc a { display: block; padding: 4px 0 4px 12px; border-left: 2px solid var(--hairline); color: var(--muted); text-decoration: none; transition: color 150ms ease, border-color 150ms ease; }
.toc a:hover { color: var(--text); }
.toc a.is-active { border-left-color: var(--primary); color: var(--primary); font-weight: 500; }
.cs-article { max-width: 68ch; }
.cs-article h2 { margin: 40px 0 12px; font-size: 20px; font-weight: 600; scroll-margin-top: 24px; }
.cs-article h2:first-child { margin-top: 0; }
.cs-article h3 { margin: 24px 0 8px; font-size: 17px; font-weight: 600; }
.cs-article p, .cs-article ul, .cs-article ol { margin: 0 0 16px; }
/* Mono is reserved for tech tags, so code spans use the body font. */
.cs-article code { font-family: inherit; font-size: inherit; font-weight: 500; color: var(--text); }
.cs-article table { display: block; overflow-x: auto; margin: 0 0 16px; border-collapse: collapse; font-size: 15px; }
.cs-article th, .cs-article td { padding: 6px 12px 6px 0; border-bottom: 1px solid var(--hairline); text-align: left; }
.decision { display: block; margin: 24px 0; padding: 16px 20px; border-left: 3px solid var(--secondary); border-radius: 0 var(--radius-box) var(--radius-box) 0; background: var(--secondary-tint); }
.decision strong:first-child { color: var(--text); }

@media (max-width: 800px) {
  .cs-body { grid-template-columns: minmax(0, 1fr); }
  .toc { display: none; }
}
@media (max-width: 640px) {
  .cs-header h1 { font-size: 30px; }
  .cs-hero { padding: 24px 16px; }
}
```

- [ ] **Step 6: Run all tests**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add layouts assets/css/site.css tests/case-study.test.mjs
git commit -m "feat: add case-study page with TOC and decision callout

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Draft the two case studies

**Files:**
- Modify: `content/projects/office-hours.md` (body only), `content/projects/strength-in-numbers.md` (body only)
- Test: `tests/case-study-content.test.mjs`

**Interfaces:**
- Consumes: the `decision` shortcode (Task 6).
- Produces: real case-study bodies. Task 9's TOC test scrolls to the third `##` heading, so each page needs enough content below it to scroll.

**Sources (read before writing):**
- office-hours: `~/code/office-hours/README.md` (the current, post-fix numbers only), `docs/DESIGN.md`, `docs/V3_REFUSAL_FIX.md`, `docs/RESULTS_HISTORY.md`, `DESIGN_REVIEW.md`, and `eval/` and `redteam/` results. The README has Carol's in-progress edit notes (lines starting `//`). Treat them as Carol's notes, not as content, and don't quote them.
- strength-in-numbers: `~/code/strength-in-numbers/CLAUDE.md`, `docs/DESIGN.md`, `docs/specs/` (the API/UI split and the 12-section template), `docs/backlog.md`, and `next-steps.md`.

**Writing rules:**
- First person, plain language, 500–900 words per case study.
- The six `##` sections are exactly: `The problem`, `What I built`, `How it works`, `Decisions & tradeoffs`, `Results & evals`, `What I'd do next`.
- At least one `{{< decision >}}…{{< /decision >}}` per page, each a single paragraph, in "Decisions & tradeoffs".
- Every number must come from the repo's current results. Don't invent metrics. For strength-in-numbers, "Results & evals" covers test and coverage gates and CI checks, not user metrics.
- Anonymity: no employer names, internal project names, colleague names, or identifying details. The fictional "Riverton University" may be named as the fictional test domain.
- Avoid code identifiers where plain words work (code spans render in the body font).

- [ ] **Step 1: Write the failing tests `tests/case-study-content.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite } from './helpers.mjs';

const site = buildSite();
const SECTIONS = ['The problem', 'What I built', 'How it works', 'Decisions & tradeoffs', 'Results & evals', "What I'd do next"];

for (const slug of ['office-hours', 'strength-in-numbers']) {
  const page = `projects/${slug}/index.html`;
  const doc = site.html(page);

  test(`${slug}: the six sections in order`, () => {
    const headings = doc.querySelectorAll('.cs-article h2').map((h) => h.text.trim().replace(/[’‘]/g, "'"));
    assert.deepEqual(headings, SECTIONS);
  });

  test(`${slug}: has a key decision callout`, () => {
    assert.ok(doc.querySelectorAll('.cs-article aside.decision').length >= 1);
  });

  test(`${slug}: no placeholders and a reasonable length`, () => {
    assert.doesNotMatch(site.read(page), /\[TODO/);
    const words = doc.querySelector('.cs-article').text.split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 500 && words <= 1000, `${words} words`);
  });
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/case-study-content.test.mjs`
Expected: FAIL on "no placeholders" and "decision callout" for both pages.

- [ ] **Step 3: Draft `office-hours.md`**

Keep the front matter and replace the body under the six headings, following the sources and rules above. Suggested focus:
- The problem: grounding a small model; refusing correctly.
- What I built: the agent with two tools and a structured answer.
- How it works: retrieval backends, the composed system prompt, and the run caps.
- Decisions & tradeoffs: a Haiku agent with a Sonnet judge; disabling built-in tools; scoring cap hits as errors.
- Results & evals: v1 vs v2 vs v3 and the red-team results from the current README.
- What I'd do next: from the V3 doc and the LOCAL_LLM_PLAN.

- [ ] **Step 4: Draft `strength-in-numbers.md`**

Keep the front matter and replace the body. Suggested focus:
- The problem: one-handed logging in a gym.
- What I built: a pnpm monorepo with the API, a pure domain core, and a web SPA.
- How it works: Auth0 PKCE, problem+json errors, migrations and seeding as release steps.
- Decisions & tradeoffs: a framework-free core enforced in CI; API-first specs; expand-only migrations.
- Results & evals: acceptance-criteria-named tests, 90% coverage gates, Testcontainers integration tests, CI checks.
- What I'd do next: from the backlog and next-steps.

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add content/projects/office-hours.md content/projects/strength-in-numbers.md tests/case-study-content.test.mjs
git commit -m "content: draft office-hours and strength-in-numbers case studies

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Site-wide link and content checks

**Files:**
- Test: `tests/site-checks.test.mjs`

**Interfaces:**
- Consumes: `buildSite` (Task 2); every page from Tasks 2–7.
- Produces: the spec §10 checks 4 and 5 as tests. The `[TODO` gate runs only when `REQUIRE_FILLED=1`.

- [ ] **Step 1: Write the tests `tests/site-checks.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';
import { buildSite } from './helpers.mjs';

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? files(full) : [full];
  });
}

const site = buildSite({ args: ['--minify'] });
const all = files(site.out);
const pages = all.filter((f) => f.endsWith('.html'));

function resolveTarget(fromFile, path) {
  if (path === '') return fromFile;
  const full = path.startsWith('/') ? join(site.out, path) : join(fromFile, '..', path);
  if (existsSync(full) && statSync(full).isDirectory()) return join(full, 'index.html');
  return full;
}

test('every local href and #anchor resolves', () => {
  const broken = [];
  for (const file of pages) {
    const doc = parse(readFileSync(file, 'utf8'));
    for (const el of doc.querySelectorAll('a[href], link[href]')) {
      const href = el.getAttribute('href');
      if (/^(https?:|mailto:)/.test(href)) continue;
      const [path, anchor] = href.split('#');
      const target = resolveTarget(file, path);
      if (!existsSync(target)) {
        broken.push(`${relative(site.out, file)} → ${href} (missing file)`);
        continue;
      }
      if (anchor && !parse(readFileSync(target, 'utf8')).getElementById(decodeURIComponent(anchor))) {
        broken.push(`${relative(site.out, file)} → ${href} (missing #${anchor})`);
      }
    }
  }
  assert.deepEqual(broken, []);
});

test('the expected pages exist and nothing else is published as HTML', () => {
  assert.deepEqual(pages.map((f) => relative(site.out, f)).sort(), [
    '404.html',
    'index.html',
    'projects/office-hours/index.html',
    'projects/strength-in-numbers/index.html',
  ]);
});

test('no theme leftovers, LinkedIn, or resume links in the output', () => {
  for (const file of all.filter((f) => /\.(html|css|xml|js)$/.test(f))) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /ananke|portfolio\.css|linkedin|résumé|resume\.pdf/i, relative(site.out, file));
  }
});

test('no [TODO placeholders in the real published output', { skip: process.env.REQUIRE_FILLED ? false : 'set REQUIRE_FILLED=1 once Carol fills in years and experience' }, () => {
  const real = buildSite({ about: (a) => a, args: ['--minify'] });
  for (const file of files(real.out).filter((f) => f.endsWith('.html'))) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /\[TODO/, relative(real.out, file));
  }
});
```

- [ ] **Step 2: Run the tests**

Run: `node --test tests/site-checks.test.mjs`
Expected: PASS, with the `[TODO` test skipped. If "expected pages" fails because `sitemap.xml` is listed, that's fine: the filter keeps only `.html`. If it lists an unexpected `.html` page, find the template or content that produced it and remove it; don't loosen the test.

If a link check fails, fix the template that produced the link. Don't change the test.

- [ ] **Step 3: Commit**

```bash
git add tests/site-checks.test.mjs
git commit -m "test: add internal link check and published-content checks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Rendered checks, screenshots, and review

**Files:**
- Create: `tests/browser.test.mjs`, `scripts/screenshots.mjs`

**Interfaces:**
- Consumes: `buildSite`, `serve` (Task 2); `.toc a.is-active` (Task 6); real content (Task 7).
- Produces: the rendered AA contrast audit and overflow checks, the TOC behavior test, and PNG screenshots in `screenshots/` (gitignored).

- [ ] **Step 1: Write `tests/browser.test.mjs`**

```js
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { buildSite, serve } from './helpers.mjs';

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
```

- [ ] **Step 2: Run the browser tests**

Run: `node --test tests/browser.test.mjs`
Expected: all PASS. If the contrast audit fails, the message names the element and ratio. Fix the CSS by moving the text to a token pair that passes; never lower the threshold. If overflow fails at 375px, find the widest element and add wrapping (`overflow-wrap: anywhere`, `flex-wrap`, or `minmax(0, 1fr)`).

- [ ] **Step 3: Write `scripts/screenshots.mjs`**

```js
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
```

- [ ] **Step 4: Take the screenshots and review them**

Run: `npm run screenshots`
Expected: six PNG paths printed. Open each PNG with the Read tool and check it against spec §5 and §6:
- The featured tile spans both columns at 1280px, and there's one column at 375px.
- Diagram panels alternate.
- The fact tiles tint petrol / maroon / petrol.
- The TOC is sticky at 1280px and hidden at 375px.
- No uppercase labels, no gradients, and mono only on tags.

The screenshots use the real `about.json`, so `[TODO` placeholders show, as expected. Fix any visual issue in CSS, rerun `npm test` and `npm run screenshots`, then share the six file paths with Carol (`open screenshots/`).

- [ ] **Step 5: Anonymity review with Carol**

List every drafted string for Carol in one message:
- the `about.json` hero, about, and fact copy
- each project `summary` and diagram labels
- a one-line gist of each case-study section

Then run:
```bash
grep -rniE "inc\.|llc|corp|ltd|client|employer|my company|at work" content/ data/
```
Report any hits. Ask Carol to confirm no employer, internal project, or colleague names appear, and apply her edits.

- [ ] **Step 6: Final verification**

```bash
npm test
hugo --minify --panicOnWarning 2>&1 | tail -5
REQUIRE_FILLED=1 node --test tests/site-checks.test.mjs 2>&1 | tail -5
```
Expected until Carol fills in her years and experience:
- `npm test` passes, with the `[TODO` test skipped.
- `hugo --minify --panicOnWarning` fails, and the only error is a `placeholder not filled: data/about.json…` warning.
- `REQUIRE_FILLED=1` fails on `[TODO`.

After Carol supplies fact 1 and the experience entries, all three commands must succeed. Then run `rm -rf public resources` to clean up the local build.

- [ ] **Step 7: Commit**

```bash
git add tests/browser.test.mjs scripts/screenshots.mjs
git commit -m "test: add rendered contrast, overflow, TOC, and focus checks plus screenshots

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
