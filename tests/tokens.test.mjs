import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './helpers.mjs';

const css = readFileSync(join(ROOT, 'assets/css/site.css'), 'utf8');
const rootBlock = css.match(/:root\s*{([^}]*)}/)[1];
const tokens = Object.fromEntries([...rootBlock.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2].toUpperCase()]));

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('tokens match the spec exactly', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(tokens).filter(([k]) => k !== 'on-primary')),
    {
      primary: '#1D5F7A', 'primary-dark': '#174C62', 'primary-tint': '#E6F0F3',
      secondary: '#6E2230', 'secondary-tint': '#F4E9EA', bg: '#FAFAF9', surface: '#FFFFFF',
      text: '#18181B', 'text-body': '#3F3F46', muted: '#52525B', subtle: '#71717A',
      border: '#E4E4E7', hairline: '#EDEDEC',
    },
  );
  assert.equal(tokens['on-primary'], '#FFFFFF');
});

// [foreground, background] for every text-on-background pair the stylesheet uses. All are body-size text: 4.5:1.
const PAIRS = [
  ['text', 'bg'], ['text', 'surface'], ['text', 'primary-tint'], ['text', 'secondary-tint'],
  ['text-body', 'bg'], ['text-body', 'surface'], ['text-body', 'secondary-tint'],
  ['muted', 'bg'], ['muted', 'surface'], ['muted', 'primary-tint'], ['muted', 'secondary-tint'],
  ['subtle', 'bg'], ['subtle', 'surface'],
  ['primary', 'bg'], ['primary', 'surface'], ['primary', 'primary-tint'], ['primary', 'secondary-tint'],
  ['primary-dark', 'surface'], ['primary-dark', 'primary-tint'],
  ['secondary', 'bg'], ['secondary', 'surface'], ['secondary', 'primary-tint'], ['secondary', 'secondary-tint'],
  ['on-primary', 'primary'], ['on-primary', 'primary-dark'],
];

for (const [fg, bg] of PAIRS) {
  test(`--${fg} on --${bg} meets 4.5:1`, () => {
    const ratio = contrast(tokens[fg], tokens[bg]);
    assert.ok(ratio >= 4.5, `${ratio.toFixed(2)}:1`);
  });
}

test('no gradients, no uppercase labels, and no raw colors outside :root', () => {
  assert.doesNotMatch(css, /gradient\(/);
  assert.doesNotMatch(css, /text-transform:\s*uppercase/);
  const outsideRoot = css.replace(/:root\s*{[^}]*}/, '');
  assert.doesNotMatch(outsideRoot, /#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});
