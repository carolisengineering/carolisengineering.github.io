import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, fillPlaceholders, readAbout } from './helpers.mjs';

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
  for (const link of about.links) assert.deepEqual(Object.keys(link).sort(), ['label', 'url']);
});

test('every skill category has a name and at least one item', () => {
  assert.ok(about.skills.length >= 1);
  for (const skill of about.skills) {
    assert.ok(skill.category, 'skill without a category');
    assert.ok(skill.items.length >= 1, `${skill.category} has no items`);
  }
});

test('unfilled placeholders warn but still render; --panicOnWarning fails', () => {
  // about.json is filled in now, so inject placeholders to exercise the check.
  const withTodos = (a) => ({
    ...a,
    facts: [{ ...a.facts[0], value: '[TODO years]' }, ...a.facts.slice(1)],
    experience: [{ ...a.experience[0], start: '[TODO start]' }, ...a.experience.slice(1)],
  });
  const raw = buildSite({ about: withTodos });
  assert.ok(raw.ok, raw.log);
  assert.match(raw.log, /placeholder not filled: data\/about\.json\.facts\[0\]\.value/);
  assert.match(raw.log, /placeholder not filled: data\/about\.json\.experience\[0\]\.start/);
  const strict = buildSite({ about: withTodos, args: ['--panicOnWarning'] });
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

const tileOnly = (lines) => ({
  'content/projects/zz-req.md': [
    '---', 'title: zz-req', ...lines, 'weight: 9', 'build: { render: never, list: always }',
    'diagram:', '  - { label: A, next: "→" }', '  - { label: B, next: "→" }', '  - { label: C }', '---', '',
  ].join('\n'),
});

for (const [label, files, message] of [
  ['project without repo', tileOnly(['summary: s', 'tags: [X]']), /zz-req is missing repo/],
  ['project without summary', tileOnly(['repo: https://example.com/zz', 'tags: [X]']), /zz-req is missing summary/],
  ['project without tags', tileOnly(['repo: https://example.com/zz', 'summary: s']), /zz-req is missing tags/],
]) {
  test(`required project field warns: ${label}`, () => {
    assert.match(buildSite({ files }).log, message);
  });
}

for (const [label, change, message] of [
  ['headline', ({ headline, ...a }) => a, /about\.json is missing headline/],
  ['headlineHighlight', (a) => ({ ...a, headlineHighlight: '' }), /about\.json is missing headlineHighlight/],
  ['lede', ({ lede, ...a }) => a, /about\.json is missing lede/],
  ['intro', ({ intro, ...a }) => a, /about\.json is missing intro/],
  ['links', (a) => ({ ...a, links: [] }), /about\.json is missing links/],
  ['facts', (a) => ({ ...a, facts: [] }), /about\.json is missing facts/],
  ['skills', (a) => ({ ...a, skills: [] }), /about\.json is missing skills/],
  ['experience industry', (a) => ({ ...a, experience: [{ start: '2020', end: 'now', role: 'Engineer', summary: 's' }] }), /experience\[0\] is missing industry/],
  ['fact label', (a) => ({ ...a, facts: [{ value: 'v' }] }), /facts\[0\] is missing label/],
  ['skill items', (a) => ({ ...a, skills: [{ category: 'C', items: [] }] }), /skills\[0\] is missing items/],
]) {
  test(`required about field warns: ${label}`, () => {
    const s = buildSite({ about: (a) => change(fillPlaceholders(a)) });
    assert.match(s.log, message, s.log);
  });
}

test('a diagram node without a label warns', () => {
  const s = buildSite({
    files: {
      'content/projects/zz-req.md': [
        '---', 'title: zz-req', 'summary: s', 'tags: [X]', 'repo: https://example.com/zz', 'weight: 9',
        'build: { render: never, list: always }',
        'diagram:', '  - { label: A, next: "→" }', '  - { next: "→" }', '  - { label: C }', '---', '',
      ].join('\n'),
    },
  });
  assert.match(s.log, /diagram for zz-req: node 2 is missing label/);
});
