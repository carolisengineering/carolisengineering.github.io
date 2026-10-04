import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, fillPlaceholders, readAbout } from './helpers.mjs';

const about = fillPlaceholders(readAbout());
const doc = buildSite().html('index.html');
const squash = (s) => s.replace(/\s+/g, ' ').trim();
const withAbout = (change) => buildSite({ about: (a) => change(fillPlaceholders(a)) }).html('index.html');

test('hero shows the now pill, headline with maroon highlight, and lede', () => {
  const pill = doc.querySelector('.hero .now-pill');
  if (about.now) assert.equal(pill.text.trim(), about.now);
  else assert.equal(pill, null);
  const h1 = doc.querySelector('.hero h1');
  assert.equal(squash(h1.text), `${about.headline} ${about.headlineHighlight}`);
  assert.equal(h1.querySelector('.highlight').text.trim(), about.headlineHighlight);
  assert.equal(doc.querySelector('.hero .lede').text.trim(), about.lede);
});

test('an empty or missing now hides the pill', () => {
  assert.equal(withAbout((a) => ({ ...a, now: '' })).querySelector('.now-pill'), null);
  assert.equal(withAbout(({ now, ...a }) => a).querySelector('.now-pill'), null);
});

test('hero buttons: See projects, then one per link (Email appears when added)', () => {
  const buttons = (d) => d.querySelectorAll('.hero-actions a.button').map((a) => [a.text.trim(), a.getAttribute('href')]);
  assert.deepEqual(buttons(doc), [['See projects', '#projects'], ...about.links.map((l) => [l.label, l.url])]);
  assert.ok(doc.querySelector('.hero-actions a.button--primary[href="#projects"]'));
  const email = withAbout((a) => ({ ...a, links: [...a.links, { label: 'Email', url: 'mailto:hi@example.com' }] }));
  assert.deepEqual(buttons(email).at(-1), ['Email', 'mailto:hi@example.com']);
});

test('facts render every entry, in order, with one tint', () => {
  assert.equal(doc.querySelectorAll('#about .facts > li.fact').length, about.facts.length);
  assert.equal(doc.querySelector('.fact--secondary'), null);
  const five = withAbout((a) => ({ ...a, facts: [1, 2, 3, 4, 5].map((n) => ({ value: `v${n}`, label: `l${n}` })) }));
  assert.deepEqual(five.querySelectorAll('.fact-value').map((v) => v.text.trim()), ['v1', 'v2', 'v3', 'v4', 'v5']);
  assert.equal(squash(doc.querySelectorAll('.fact-label')[1].text), about.facts[1].label);
});

test('experience timeline shows years, role · industry, and summary', () => {
  const two = withAbout((a) => ({
    ...a,
    showExperience: true,
    experience: [
      { start: '2022', end: 'now', role: 'Software Engineer', industry: 'EdTech', summary: 'Built things.' },
      { start: '2019', end: '2022', role: 'Developer', industry: 'Logistics', summary: 'Shipped things.' },
    ],
  }));
  const rows = two.querySelectorAll('#experience .timeline > li.timeline-row');
  assert.equal(rows.length, 2);
  assert.equal(squash(rows[0].querySelector('.timeline-years').text), '2022 – now');
  assert.equal(squash(rows[0].querySelector('.timeline-role').text), 'Software Engineer · EdTech');
  assert.equal(rows[0].querySelector('.industry').text.trim(), 'EdTech');
  assert.equal(rows[1].querySelector('.timeline-summary').text.trim(), 'Shipped things.');
});

test('an empty experience list hides the Experience section', () => {
  const none = withAbout((a) => ({ ...a, experience: [] }));
  assert.equal(none.querySelector('#experience'), null);
  assert.equal(none.querySelector('.timeline'), null);
});

test('showExperience false hides the section; true or missing shows it', () => {
  const off = withAbout((a) => ({ ...a, showExperience: false }));
  assert.equal(off.querySelector('#experience'), null);
  assert.ok(withAbout((a) => ({ ...a, showExperience: true })).querySelector('#experience .timeline'));
  assert.ok(withAbout(({ showExperience, ...a }) => a).querySelector('#experience .timeline'));
});

test('a stray company field is never rendered', () => {
  const leaked = withAbout((a) => ({
    ...a,
    showExperience: true,
    experience: a.experience.map((e) => ({ ...e, company: 'Acme Employer Inc' })),
  }));
  assert.doesNotMatch(leaked.toString(), /Acme Employer Inc/);
});

test('skills render as a definition list in data order', () => {
  const rows = doc.querySelectorAll('#skills dl.skills dt');
  assert.deepEqual(rows.map((dt) => dt.text.trim()), about.skills.map((s) => s.category));
  assert.deepEqual(
    doc.querySelectorAll('#skills dl.skills dd').map((dd) => dd.text.trim()),
    about.skills.map((s) => s.items.join(' · ')),
  );
});

test('section headings are sentence case and in order', () => {
  assert.deepEqual(doc.querySelectorAll('main h2').map((h) => h.text.trim()), ['About', 'Projects', ...(about.showExperience === false ? [] : ['Experience']), 'Skills']);
  assert.equal(doc.querySelectorAll('main h1').length, 1);
});
