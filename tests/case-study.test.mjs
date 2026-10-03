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
  const links = doc.querySelectorAll('.cs-body .toc a');
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

test('each navigation landmark has its own label', () => {
  const labels = doc.querySelectorAll('nav').map((n) => n.getAttribute('aria-label'));
  assert.deepEqual(labels, ['Main', 'On this page']);
  assert.equal(doc.querySelector('aside.toc'), null, 'the TOC is not wrapped in a second labelled landmark');
});
