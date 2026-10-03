import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_ENTRIES = ['hugo.toml', 'layouts', 'assets', 'static', 'data', 'content'];

// Every temp build dir is removed when the test process exits.
const tempDirs = [];
process.on('exit', () => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

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
  tempDirs.push(tmp);
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
