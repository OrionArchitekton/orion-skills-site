import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Color from 'colorjs.io';

const ROOT = join(import.meta.dirname, '..');

function resolveToken(tokens, ref) {
  const parts = ref.split('.');
  let cur = tokens;
  for (const part of parts) {
    cur = cur?.[part];
  }
  assert.ok(cur?.$value, `Missing token value for ${ref}`);
  return cur.$value;
}

test('all brand.tokens.json contrastPairs meet WCAG 2.1 AA thresholds', () => {
  const tokens = JSON.parse(readFileSync(join(ROOT, 'tokens/brand.tokens.json'), 'utf8'));
  const pairs = tokens.$extensions?.['com.orion.contrastPairs'] ?? [];
  assert.ok(pairs.length > 0, 'brand.tokens.json must define contrastPairs');

  for (const pair of pairs) {
    const fgHex = resolveToken(tokens, pair.fg);
    const bgHex = resolveToken(tokens, pair.bg);
    const ratio = new Color(fgHex).contrast(new Color(bgHex), 'WCAG21');
    const min = pair.level === 'normal' ? 4.5 : 3.0;
    assert.ok(
      ratio >= min,
      `${pair.name}: ${fgHex} on ${bgHex} contrast ${ratio.toFixed(2)}:1 < ${min}:1`,
    );
  }
});

test('index.css defines Deep Slate-Navy canvas and prefers-reduced-motion rule', () => {
  const tokens = JSON.parse(readFileSync(join(ROOT, 'tokens/brand.tokens.json'), 'utf8'));
  const css = readFileSync(join(ROOT, 'index.css'), 'utf8');
  assert.ok(css.includes(tokens.color.bg.$value), 'index.css must include Deep Slate-Navy bg');
  assert.match(css, /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
});

test('built HTML preserves single semantic landmarks', () => {
  const html = readFileSync(join(ROOT, 'dist/index.html'), 'utf8');
  assert.equal((html.match(/<header\b/g) ?? []).length, 1, 'exactly one <header>');
  assert.equal((html.match(/<nav\b/g) ?? []).length, 1, 'exactly one <nav>');
  assert.equal((html.match(/<main\b/g) ?? []).length, 1, 'exactly one <main>');
  assert.equal((html.match(/<footer\b/g) ?? []).length, 1, 'exactly one <footer>');
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1, 'exactly one <h1>');
});
