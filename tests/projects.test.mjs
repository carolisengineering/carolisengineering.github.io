import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSite, frontMatter, ROOT } from './helpers.mjs';

const site = buildSite();
const tiles = () => site.html('index.html').querySelectorAll('#projects .tiles > a.tile');
const name = (tile) => tile.querySelector('.tile-name').text.trim();

test('tiles are ordered by weight; only the tile-only project is compact', () => {
  const t = tiles();
  assert.deepEqual(t.map(name), ['Office Hours', 'Strength in Numbers', 'This site']);
  assert.deepEqual(t.map((x) => x.classList.contains('tile--compact')), [false, false, true]);
  assert.equal(site.html('index.html').querySelector('.tile--featured'), null);
});

test('every tile shows its summary', () => {
  const t = tiles();
  assert.match(t[0].querySelector('.tile-summary').text, /AI agent that answers students/);
  assert.match(t[1].querySelector('.tile-summary').text, /Full-stack workout tracker for use at the gym/);
  assert.match(t[2].querySelector('.tile-summary').text, /A portfolio built with Hugo/);
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

test('case-study tiles put the diagram on a petrol panel; the compact tile has no panel', () => {
  const panels = tiles().map((x) => x.querySelector('.tile-diagram').classList);
  assert.ok(panels[0].contains('panel--primary'));
  assert.ok(panels[1].contains('panel--primary'));
  assert.equal(panels[2].contains('panel--primary') || panels[2].contains('panel--secondary'), false);
});

test('diagram renders nodes, styles, connectors, and a readable aria-label', () => {
  const d = tiles()[1].querySelector('.diagram');
  assert.ok(d.classList.contains('diagram--compact'));
  assert.equal(d.getAttribute('role'), 'img');
  assert.equal(d.getAttribute('aria-label'), 'React SPA to Fastify API to PostgreSQL');
  assert.deepEqual(d.querySelectorAll('.node').map((n) => [n.text.trim(), n.getAttribute('class')]), [
    ['React SPA', 'node'],
    ['Fastify API', 'node node--primary'],
    ['PostgreSQL', 'node node--secondary'],
  ]);
  assert.deepEqual(d.querySelectorAll('.edge').map((e) => e.classList.contains('edge--both')), [false, false]);
  const twoWay = tiles()[0].querySelectorAll('.edge').map((e) => e.classList.contains('edge--both'));
  assert.deepEqual(twoWay, [false, true]);
  assert.ok(d.querySelectorAll('.edge').every((e) => e.getAttribute('aria-hidden') === 'true'));
});

test('tags render as a list', () => {
  const tags = tiles()[1].querySelectorAll('.tags li').map((li) => li.text.trim());
  assert.deepEqual(tags, ['TypeScript', 'React', 'Fastify', 'Prisma', 'PostgreSQL', 'Docker']);
});

test('changing weights reorders the tiles, and a tile-only project stays compact', () => {
  const thisSite = readFileSync(join(ROOT, 'content/projects/this-site.md'), 'utf8').replace('weight: 3', 'weight: -1');
  const s = buildSite({ files: { 'content/projects/this-site.md': thisSite } });
  const first = s.html('index.html').querySelector('#projects .tiles > a.tile');
  assert.ok(first.classList.contains('tile--compact'));
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
    const ids = tile.getAttribute('aria-labelledby').split(' ');
    const nameId = ids[0];
    const externalId = ids.find((x) => x.endsWith('-external'));
    assert.ok(doc.getElementById(nameId)?.classList.contains('tile-name'), 'aria-labelledby points at the tile name');
    // Only the tile that leaves the site says so in its accessible name.
    assert.equal(Boolean(externalId), tile.classList.contains('tile--compact'));
    if (externalId) assert.equal(doc.getElementById(externalId).text.trim(), '(opens on GitHub)');
  }
  // A case-study tile is described by its summary and its key decision; its status joins its name.
  const described = (tile) => tile.getAttribute('aria-describedby').split(' ').map((x) => doc.getElementById(x).text.trim()).join(' | ');
  assert.match(described(tiles()[0]), /AI agent that answers students.* \| Key decision/);
  assert.match(described(tiles()[1]), /Full-stack workout tracker for use at the gym.* \| Key decision/);
  const statusId = tiles()[1].getAttribute('aria-labelledby').split(' ')[1];
  assert.equal(doc.getElementById(statusId).text.trim(), 'In progress');
  assert.equal(tiles()[0].querySelector('.status'), null);
});
