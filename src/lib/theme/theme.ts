export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'atlas-theme';
export const ACCENT_PRESET_STORAGE_KEY = 'atlas-accent-preset';

export const ACCENT_PRESETS = ['gold', 'green', 'blue', 'pink', 'red'] as const;
export type AccentPreset = (typeof ACCENT_PRESETS)[number];

export const DEFAULT_ACCENT_PRESET: AccentPreset = 'gold';

export const ACCENT_PRESET_LABELS: Record<AccentPreset, string> = {
  gold: 'Gold',
  green: 'Green',
  blue: 'Blue',
  pink: 'Pink',
  red: 'Red',
};

export function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark';
}

export function isAccentPreset(value: string | null | undefined): value is AccentPreset {
  if (!value) return false;
  return ACCENT_PRESETS.includes(value as AccentPreset);
}

export function resolveTheme(value: string | null | undefined, fallback: Theme = 'light'): Theme {
  return isTheme(value) ? value : fallback;
}

export function resolveAccentPreset(
  value: string | null | undefined,
  fallback: AccentPreset = DEFAULT_ACCENT_PRESET,
): AccentPreset {
  return isAccentPreset(value) ? value : fallback;
}

export function applyThemeToRoot(theme: Theme, root: HTMLElement) {
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function applyAccentPresetToRoot(preset: AccentPreset, root: HTMLElement) {
  root.dataset.atlasAccent = preset;
}
