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
    ['About', '/#about'],
    ['Projects', '/#projects'],
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
    'fonts/ibm-plex-sans-latin-400-normal.woff2',
    'fonts/ibm-plex-sans-latin-500-normal.woff2',
    'fonts/ibm-plex-sans-latin-600-normal.woff2',
    'fonts/ibm-plex-sans-latin-700-normal.woff2',
    'fonts/IBMPlexSans-OFL.txt',
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
  assert.deepEqual(doc.querySelectorAll('.not-found-links a').map((l) => l.getAttribute('href')), [
    '/projects/office-hours/',
    '/projects/strength-in-numbers/',
    'https://github.com/carolisengineering/carolisengineering.github.io',
  ]);
});

test('every page starts with a skip link to main', () => {
  for (const page of ['index.html', '404.html', 'projects/office-hours/index.html']) {
    const doc = site.html(page);
    assert.equal(doc.querySelector('body > a.skip-link').getAttribute('href'), '#main');
    assert.ok(doc.querySelector('main#main'));
  }
});

test('no theme or old stylesheet leftovers', () => {
  for (const page of ['index.html', '404.html']) {
    assert.doesNotMatch(site.read(page), /ananke|portfolio\.css/i);
  }
});
