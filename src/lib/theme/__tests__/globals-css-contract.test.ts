import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { ACCENT_PALETTES, THEME_NEUTRAL_PALETTES } from '../tokens';

const GLOBALS_CSS_PATH = path.resolve(process.cwd(), 'src/app/globals.css');

describe('globals.css theme contract', () => {
  it('contains light/dark neutral palette values from the theme contract', () => {
    const source = readFileSync(GLOBALS_CSS_PATH, 'utf8').toLowerCase();

    for (const palette of Object.values(THEME_NEUTRAL_PALETTES)) {
      for (const value of Object.values(palette)) {
        expect(source).toContain(value.toLowerCase());
      }
    }
  });

  it('contains all accent preset palette values from the theme contract', () => {
    const source = readFileSync(GLOBALS_CSS_PATH, 'utf8').toLowerCase();

    for (const palette of Object.values(ACCENT_PALETTES)) {
      for (const value of Object.values(palette)) {
        expect(source).toContain(value.toLowerCase());
      }
    }
  });
});
