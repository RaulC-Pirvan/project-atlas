import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildLandingAuthTrackHref,
  logFunnelEvent,
  parseLandingAuthCtaSourceWithReason,
  parseLandingAuthCtaTargetWithReason,
  resetFunnelGuardrailsForTests,
} from '../funnel';

describe('funnel analytics helpers', () => {
  const previousAnalyticsEnabled = process.env.ANALYTICS_ENABLED;
  const previousFunnelEnabled = process.env.ANALYTICS_FUNNEL_ENABLED;

  beforeEach(() => {
    process.env.ANALYTICS_ENABLED = 'true';
    process.env.ANALYTICS_FUNNEL_ENABLED = 'true';
    resetFunnelGuardrailsForTests();
  });

  afterEach(() => {
    if (previousAnalyticsEnabled === undefined) {
      delete process.env.ANALYTICS_ENABLED;
    } else {
      process.env.ANALYTICS_ENABLED = previousAnalyticsEnabled;
    }

    if (previousFunnelEnabled === undefined) {
      delete process.env.ANALYTICS_FUNNEL_ENABLED;
    } else {
      process.env.ANALYTICS_FUNNEL_ENABLED = previousFunnelEnabled;
    }

    resetFunnelGuardrailsForTests();
    vi.restoreAllMocks();
  });

  it('parses landing auth source and target with fallback reasons', () => {
    expect(parseLandingAuthCtaSourceWithReason('hero_primary')).toEqual({
      source: 'hero_primary',
      reason: 'accepted',
      raw: 'hero_primary',
    });
    expect(parseLandingAuthCtaSourceWithReason('')).toEqual({
      source: 'hero_primary',
      reason: 'missing',
      raw: null,
    });
    expect(parseLandingAuthCtaSourceWithReason('unexpected-source')).toEqual({
      source: 'hero_primary',
      reason: 'invalid',
      raw: 'unexpected-source',
    });

    expect(parseLandingAuthCtaTargetWithReason('/sign-in')).toEqual({
      target: '/sign-in',
      reason: 'accepted',
      raw: '/sign-in',
    });
    expect(parseLandingAuthCtaTargetWithReason('')).toEqual({
      target: '/sign-up',
      reason: 'missing',
      raw: null,
    });
    expect(parseLandingAuthCtaTargetWithReason('/unexpected')).toEqual({
      target: '/sign-up',
      reason: 'invalid',
      raw: '/unexpected',
    });
  });

  it('builds deterministic tracked hrefs for landing auth CTA links', () => {
    expect(buildLandingAuthTrackHref({ source: 'hero_secondary', target: '/sign-in' })).toBe(
      '/landing/auth/track?target=%2Fsign-in&source=hero_secondary',
    );
  });

  it('suppresses duplicate auth sign-in events in dedupe window', () => {
    const infoSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logFunnelEvent({
      event: 'auth_sign_in_completed',
      surface: '/api/auth/sign-in',
      authenticated: true,
      userId: 'user-1',
      provider: 'credentials',
    });
    logFunnelEvent({
      event: 'auth_sign_in_completed',
      surface: '/api/auth/sign-in',
      authenticated: true,
      userId: 'user-1',
      provider: 'credentials',
    });

    const infoLines = infoSpy.mock.calls.map((args) => String(args[0]));
    const warnLines = warnSpy.mock.calls.map((args) => String(args[0]));

    expect(infoLines.filter((line) => line.includes('"message":"analytics.funnel"')).length).toBe(
      1,
    );
    expect(warnLines.some((line) => line.includes('"message":"analytics.funnel.guardrail"'))).toBe(
      true,
    );
  });

  it('drops invalid landing auth CTA payloads and emits guardrail logs', () => {
    const infoSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logFunnelEvent({
      event: 'landing_auth_cta_click',
      surface: '/landing/auth/track',
      authenticated: false,
      source: 'hero_primary',
      // target intentionally omitted to verify schema guardrail
    });

    const infoLines = infoSpy.mock.calls.map((args) => String(args[0]));
    const warnLines = warnSpy.mock.calls.map((args) => String(args[0]));

    expect(infoLines.some((line) => line.includes('"message":"analytics.funnel"'))).toBe(false);
    expect(warnLines.some((line) => line.includes('"reason":"invalid_payload_dropped"'))).toBe(
      true,
    );
  });

  it('does not emit events when analytics tracking is disabled', () => {
    process.env.ANALYTICS_ENABLED = 'false';
    const infoSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    logFunnelEvent({
      event: 'landing_page_view',
      surface: '/landing',
      authenticated: false,
    });

    expect(infoSpy).not.toHaveBeenCalled();
  });
});
