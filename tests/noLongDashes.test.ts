import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const LONG_DASH_RE = /[\u2013\u2014\u2015]/g;

const SOURCE_FILES = [
  '../constants.ts',
  '../App.tsx',
  '../ProductDemo.tsx',
  '../index.html',
  '../index.tsx',
  '../index.css',
  '../types.ts',
  '../vite-plugin-bodybake.ts',
  '../vite.config.ts',
  '../tailwind.config.js',
  '../DESIGN.md',
  '../tokens/brand.tokens.json',
  './brandContrast.test.ts',
];

test('source files contain zero U+2013/U+2014/U+2015 long dashes', () => {
  for (const rel of SOURCE_FILES) {
    const content = readFileSync(new URL(rel, import.meta.url), 'utf8');
    const matches = content.match(LONG_DASH_RE) ?? [];
    assert.equal(matches.length, 0, `${rel} contains long dashes: ${matches.length}`);
  }
});

test('built dist/index.html contains zero U+2013/U+2014/U+2015 long dashes', () => {
  const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  const matches = html.match(LONG_DASH_RE) ?? [];
  assert.equal(matches.length, 0, `dist/index.html contains long dashes: ${matches.length}`);
});
