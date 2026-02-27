import { describe, expect, it } from 'vitest';

import { getContrastRatio } from '../contrast';
import {
  ACCENT_PALETTES,
  SEMANTIC_STATE_COLORS,
  THEME_NEUTRAL_PALETTES,
  WCAG_CONTRAST_THRESHOLDS,
} from '../tokens';

describe('theme contrast gates', () => {
  it('keeps base text readable on surface layers in light and dark themes', () => {
    for (const [theme, palette] of Object.entries(THEME_NEUTRAL_PALETTES)) {
      const primaryRatio = getContrastRatio(palette.textPrimary, palette.bgSurface);
      const secondaryRatio = getContrastRatio(palette.textSecondary, palette.bgSurface);
      const mutedRatio = getContrastRatio(palette.textMuted, palette.bgSurface);

      expect(primaryRatio).toBeGreaterThanOrEqual(WCAG_CONTRAST_THRESHOLDS.text);
      expect(secondaryRatio).toBeGreaterThanOrEqual(WCAG_CONTRAST_THRESHOLDS.text);
      expect(mutedRatio).toBeGreaterThanOrEqual(WCAG_CONTRAST_THRESHOLDS.largeText);
      expect(theme).toMatch(/light|dark/);
    }
  });

  it('keeps accent text readable across all accent presets', () => {
    for (const palette of Object.values(ACCENT_PALETTES)) {
      const ratio = getContrastRatio(palette.textOnAccent, palette.solid);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_CONTRAST_THRESHOLDS.text);
    }
  });

  it('keeps semantic state text contrast readable on both theme surfaces', () => {
    for (const themePalette of Object.values(THEME_NEUTRAL_PALETTES)) {
      expect(
        getContrastRatio(SEMANTIC_STATE_COLORS.error, themePalette.bgSurface),
        'error token should be readable',
      ).toBeGreaterThanOrEqual(WCAG_CONTRAST_THRESHOLDS.largeText);
      expect(
        getContrastRatio(SEMANTIC_STATE_COLORS.warning, themePalette.bgSurface),
        'warning token should be readable',
      ).toBeGreaterThanOrEqual(WCAG_CONTRAST_THRESHOLDS.largeText);
      expect(
        getContrastRatio(SEMANTIC_STATE_COLORS.success, themePalette.bgSurface),
        'success token should be readable',
      ).toBeGreaterThanOrEqual(WCAG_CONTRAST_THRESHOLDS.largeText);
      expect(
        getContrastRatio(SEMANTIC_STATE_COLORS.info, themePalette.bgSurface),
        'info token should be readable',
      ).toBeGreaterThanOrEqual(WCAG_CONTRAST_THRESHOLDS.largeText);
    }
  });
});
