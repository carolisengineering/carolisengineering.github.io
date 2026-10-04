import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, buildSite } from './helpers.mjs';

const site = buildSite();
// The expected headings are the "## " lines of the case study's own markdown, outside code fences.
// Hugo renders straight apostrophes as curly ones.
const plain = (text) => text.replace(/[’‘]/g, "'");
const sourceHeadings = (slug) => {
  let fenced = false;
  const headings = [];
  for (const line of readFileSync(join(ROOT, `content/projects/${slug}.md`), 'utf8').split('\n')) {
    if (line.startsWith('```')) fenced = !fenced;
    else if (!fenced && line.startsWith('## ')) headings.push(line.slice(3).trim());
  }
  return headings;
};

for (const slug of ['office-hours', 'strength-in-numbers']) {
  const page = `projects/${slug}/index.html`;
  const doc = site.html(page);

  test(`${slug}: rendered sections match the markdown headings, in order`, () => {
    const headings = doc.querySelectorAll('.cs-article h2').map((h) => plain(h.text.trim()));
    assert.ok(headings.length >= 1);
    assert.deepEqual(headings, sourceHeadings(slug));
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
