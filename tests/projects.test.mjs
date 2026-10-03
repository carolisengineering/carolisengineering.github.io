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
  assert.deepEqual(t.map(name), ['strength-in-numbers', 'office-hours', 'carolisengineering.github.io']);
  assert.deepEqual(t.map((x) => x.classList.contains('tile--featured')), [true, false, false]);
});

test('only the featured tile shows the summary', () => {
  const t = tiles();
  assert.match(t[0].querySelector('.tile-summary').text, /mobile-first workout/);
  assert.equal(t[1].querySelector('.tile-summary'), null);
  assert.equal(t[2].querySelector('.tile-summary'), null);
});

test('case-study tiles link with →, tile-only projects link to the repo with ↗', () => {
  const t = tiles();
  assert.deepEqual(t.map((x) => [x.getAttribute('href'), x.querySelector('.arrow').text]), [
    ['/projects/strength-in-numbers/', '→'],
    ['/projects/office-hours/', '→'],
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
  assert.equal(d.getAttribute('aria-label'), 'React SPA to Fastify API to Domain core to PostgreSQL');
  assert.deepEqual(d.querySelectorAll('.node').map((n) => [n.text.trim(), n.getAttribute('class')]), [
    ['React SPA', 'node'],
    ['Fastify API', 'node node--primary'],
    ['Domain core', 'node'],
    ['PostgreSQL', 'node node--secondary'],
  ]);
  assert.deepEqual(d.querySelectorAll('.edge').map((e) => e.text.trim()), ['→', '→', '→']);
  assert.ok(d.querySelectorAll('.edge').every((e) => e.getAttribute('aria-hidden') === 'true'));
});

test('tags render as a list', () => {
  const tags = tiles()[0].querySelectorAll('.tags li').map((li) => li.text.trim());
  assert.deepEqual(tags, ['TypeScript', 'React', 'Fastify', 'Prisma', 'PostgreSQL', 'Docker']);
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

test('each tile link is named by its title, described by its summary', () => {
  const doc = site.html('index.html');
  for (const tile of tiles()) {
    const name = doc.getElementById(tile.getAttribute('aria-labelledby'));
    assert.ok(name?.classList.contains('tile-name'), 'aria-labelledby points at the tile name');
  }
  const featured = tiles()[0];
  assert.match(doc.getElementById(featured.getAttribute('aria-describedby')).text, /mobile-first workout/);
  assert.equal(tiles()[1].getAttribute('aria-describedby'), undefined);
});
