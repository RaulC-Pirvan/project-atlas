import { describe, expect, it } from 'vitest';

import { buildProIntentPath, buildProUpgradeHref, parseProCtaSource } from '../proConversion';

describe('pro conversion helpers', () => {
  it('parses known CTA sources and falls back to direct', () => {
    expect(parseProCtaSource('hero')).toBe('hero');
    expect(parseProCtaSource('comparison')).toBe('comparison');
    expect(parseProCtaSource('faq')).toBe('faq');
    expect(parseProCtaSource('direct')).toBe('direct');
    expect(parseProCtaSource('')).toBe('direct');
    expect(parseProCtaSource('unknown')).toBe('direct');
    expect(parseProCtaSource(null)).toBe('direct');
  });

  it('builds deterministic hrefs for CTA and post-auth intent', () => {
    expect(buildProUpgradeHref('hero')).toBe('/pro/upgrade?source=hero');
    expect(buildProIntentPath('comparison')).toBe('/pro?intent=upgrade&source=comparison');
  });
});
