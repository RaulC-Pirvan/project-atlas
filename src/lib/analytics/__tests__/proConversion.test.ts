import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildProIntentPath,
  buildProUpgradeHref,
  logProConversionEvent,
  parseProCtaSource,
  parseProCtaSourceWithReason,
  resetProConversionGuardrailsForTests,
} from '../proConversion';

describe('pro conversion helpers', () => {
  const previousAnalyticsEnabled = process.env.ANALYTICS_ENABLED;
  const previousBillingTrackingEnabled = process.env.BILLING_CONVERSION_TRACKING_ENABLED;

  beforeEach(() => {
    process.env.ANALYTICS_ENABLED = 'true';
    process.env.BILLING_CONVERSION_TRACKING_ENABLED = 'true';
    resetProConversionGuardrailsForTests();
  });

  afterEach(() => {
    if (previousAnalyticsEnabled === undefined) {
      delete process.env.ANALYTICS_ENABLED;
    } else {
      process.env.ANALYTICS_ENABLED = previousAnalyticsEnabled;
    }
    if (previousBillingTrackingEnabled === undefined) {
      delete process.env.BILLING_CONVERSION_TRACKING_ENABLED;
    } else {
      process.env.BILLING_CONVERSION_TRACKING_ENABLED = previousBillingTrackingEnabled;
    }
    resetProConversionGuardrailsForTests();
    vi.restoreAllMocks();
  });

  it('parses known CTA sources and falls back to direct', () => {
    expect(parseProCtaSource('hero')).toBe('hero');
    expect(parseProCtaSource('comparison')).toBe('comparison');
    expect(parseProCtaSource('faq')).toBe('faq');
    expect(parseProCtaSource('direct')).toBe('direct');
    expect(parseProCtaSource('')).toBe('direct');
    expect(parseProCtaSource('unknown')).toBe('direct');
    expect(parseProCtaSource(null)).toBe('direct');
  });

  it('tracks source parsing reason for diagnostics', () => {
    expect(parseProCtaSourceWithReason('hero')).toEqual({
      source: 'hero',
      reason: 'accepted',
      raw: 'hero',
    });
    expect(parseProCtaSourceWithReason('')).toEqual({
      source: 'direct',
      reason: 'missing',
      raw: null,
    });
    expect(parseProCtaSourceWithReason('invalid-source')).toEqual({
      source: 'direct',
      reason: 'invalid',
      raw: 'invalid-source',
    });
  });

  it('builds deterministic hrefs for CTA and post-auth intent', () => {
    expect(buildProUpgradeHref('hero')).toBe('/pro/upgrade?source=hero');
    expect(buildProIntentPath('comparison')).toBe('/pro?intent=upgrade&source=comparison');
  });

  it('suppresses duplicate page-view conversion logs in the guardrail window', () => {
    const infoSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logProConversionEvent({
      event: 'pro_page_view',
      surface: '/pro',
      authenticated: false,
      source: 'hero',
    });
    logProConversionEvent({
      event: 'pro_page_view',
      surface: '/pro',
      authenticated: false,
      source: 'hero',
    });

    const infoLines = infoSpy.mock.calls.map((args) => String(args[0]));
    const warnLines = warnSpy.mock.calls.map((args) => String(args[0]));

    expect(
      infoLines.filter((line) => line.includes('"message":"analytics.pro_conversion"')).length,
    ).toBe(1);
    expect(
      warnLines.some((line) => line.includes('"message":"analytics.pro_conversion.guardrail"')),
    ).toBe(true);
  });

  it('does not emit conversion events when analytics tracking is disabled', () => {
    process.env.ANALYTICS_ENABLED = 'false';
    const infoSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    logProConversionEvent({
      event: 'pro_cta_click',
      surface: '/pro/upgrade',
      authenticated: true,
      userId: 'user-1',
      source: 'hero',
    });

    expect(infoSpy).not.toHaveBeenCalled();
  });
});
