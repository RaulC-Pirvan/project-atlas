import { describe, expect, it } from 'vitest';

import {
  applyAccentPresetToRoot,
  applyThemeToRoot,
  resolveAccentPreset,
  resolveTheme,
} from '../theme';

describe('theme helpers', () => {
  it('falls back to default accent preset for invalid values', () => {
    expect(resolveAccentPreset('blue')).toBe('blue');
    expect(resolveAccentPreset('invalid')).toBe('gold');
    expect(resolveAccentPreset(null)).toBe('gold');
  });

  it('falls back to light theme for invalid values', () => {
    expect(resolveTheme('dark')).toBe('dark');
    expect(resolveTheme('bad')).toBe('light');
    expect(resolveTheme(undefined)).toBe('light');
  });

  it('applies theme and accent values to root element', () => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.removeAttribute('data-atlas-accent');

    applyThemeToRoot('dark', root);
    applyAccentPresetToRoot('pink', root);

    expect(root.classList.contains('dark')).toBe(true);
    expect(root.style.colorScheme).toBe('dark');
    expect(root.dataset.atlasAccent).toBe('pink');
  });
});
