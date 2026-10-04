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
  assert.equal(doc.querySelector('.cs-header h1').text.trim(), 'Office Hours');
  assert.match(doc.querySelector('.cs-header .lede').text, /^AI agent that answers students/);
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

test('hero shows the architecture diagram on a petrol-tint panel, described edge by edge', () => {
  const d = doc.querySelector('.cs-hero.panel--primary .arch');
  assert.equal(d.getAttribute('role'), 'img');
  assert.equal(d.getAttribute('aria-label'), 'Student question to Agent; Agent to and from Knowledge base (search); Agent to Structured answer (returns); Eval harness to Structured answer (scores); Agent: Haiku 4.5; Structured answer: with citations; Eval harness: Sonnet judge');
  assert.equal(d.querySelectorAll('.arch-node').length, 5);
  assert.deepEqual(d.querySelectorAll('.arch-label').map((l) => l.text.trim()), ['search', 'returns', 'scores']);
  assert.ok(d.querySelectorAll('.arch-edge').every((e) => e.getAttribute('aria-hidden') === 'true'));
});

test('a project without an architecture falls back to the large chain diagram', () => {
  const fm = frontMatter(FM).replace(/architecture:[\s\S]*?\n---\n/, '---\n');
  const d = buildSite({ files: { [FM]: fm + BODY } }).html('projects/office-hours/index.html');
  assert.equal(d.querySelector('.cs-hero .arch'), null);
  assert.equal(d.querySelector('.cs-hero .diagram.diagram--large').getAttribute('aria-label'), 'Student question to Agent to Knowledge base');
});

test('an architecture edge to an unknown node warns', () => {
  const fm = frontMatter(FM).replace('{ from: q, to: agent }', '{ from: q, to: nowhere }');
  assert.match(buildSite({ files: { [FM]: fm + BODY } }).log, /edge q to nowhere names a node that does not exist/);
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
  assert.equal(callout.querySelector('.decision-label').text.trim(), 'Key decision');
  assert.match(callout.innerHTML, /<strong>BM25<\/strong>/);
});

test('page is wide and ships the TOC highlight script', () => {
  assert.ok(doc.querySelector('body.wide'));
  assert.match(doc.querySelector('script').text, /aria-current/);
  assert.match(site.read('projects/office-hours/index.html'), /<title>Office Hours · carolisengineering<\/title>/);
});

test('homepage and 404 are not wide', () => {
  assert.equal(site.html('index.html').querySelector('body.wide'), null);
  assert.equal(site.html('404.html').querySelector('body.wide'), null);
});

test('each navigation landmark has its own label', () => {
  const labels = doc.querySelectorAll('nav').map((n) => n.getAttribute('aria-label'));
  assert.deepEqual(labels, ['Main', 'On this page', 'More']);
  assert.equal(doc.querySelector('aside.toc'), null, 'the TOC is not wrapped in a second labelled landmark');
});

test('the page ends with the next case study, the repo, and a way back', () => {
  const end = doc.querySelector('.cs-main nav.cs-end');
  const next = end.querySelector('a.cs-next');
  assert.equal(next.getAttribute('href'), '/projects/strength-in-numbers/');
  assert.match(next.text, /^Next project: Strength in Numbers/);
  assert.equal(end.querySelector('a.repo-link').getAttribute('href'), 'https://github.com/carolisengineering/office-hours');
  assert.equal(end.querySelector('a.back-link').getAttribute('href'), '/#projects');
});

test('results at a glance sit between the diagram and the article', () => {
  const strip = doc.querySelector('.case-study > ul.cs-outcomes');
  assert.equal(strip.getAttribute('aria-label'), 'Results at a glance');
  assert.deepEqual(strip.querySelectorAll('.fact-value').map((v) => v.text.trim()), ['13 of 13', '20 of 23', '45 of 45']);
  const fm = frontMatter(FM).replace(/outcomes:[\s\S]*?(?=architecture:)/, '');
  assert.equal(buildSite({ files: { [FM]: fm + BODY } }).html('projects/office-hours/index.html').querySelector('.cs-outcomes'), null);
});
