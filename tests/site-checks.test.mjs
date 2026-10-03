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
