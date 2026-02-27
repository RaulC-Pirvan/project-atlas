import { describe, expect, it } from 'vitest';

import {
  applyAccentPresetToRoot,
  applyThemeToRoot,
  resolveAccentPreset,
  resolveTheme,
  resolveThemePreferences,
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

  it('resolves persisted theme preferences with safe fallback behavior', () => {
    expect(
      resolveThemePreferences({
        storedTheme: 'dark',
        storedAccentPreset: 'green',
        systemPrefersDark: false,
      }),
    ).toEqual({ theme: 'dark', accentPreset: 'green' });

    expect(
      resolveThemePreferences({
        storedTheme: 'invalid',
        storedAccentPreset: 'bad',
        systemPrefersDark: true,
      }),
    ).toEqual({ theme: 'dark', accentPreset: 'gold' });

    expect(
      resolveThemePreferences({
        storedTheme: null,
        storedAccentPreset: null,
        systemPrefersDark: false,
      }),
    ).toEqual({ theme: 'light', accentPreset: 'gold' });
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
