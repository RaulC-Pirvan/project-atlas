import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildLandingWalkthroughTrackHref,
  logLandingWalkthroughEvent,
  parseLandingWalkthroughSourceWithReason,
  parseLandingWalkthroughTargetWithReason,
  resetLandingWalkthroughGuardrailsForTests,
} from '../landingWalkthrough';

describe('landing walkthrough analytics helpers', () => {
  const previousAnalyticsEnabled = process.env.ANALYTICS_ENABLED;
  const previousWalkthroughEnabled = process.env.LANDING_WALKTHROUGH_ENABLED;

  beforeEach(() => {
    process.env.ANALYTICS_ENABLED = 'true';
    process.env.LANDING_WALKTHROUGH_ENABLED = 'true';
    resetLandingWalkthroughGuardrailsForTests();
  });

  afterEach(() => {
    if (previousAnalyticsEnabled === undefined) {
      delete process.env.ANALYTICS_ENABLED;
    } else {
      process.env.ANALYTICS_ENABLED = previousAnalyticsEnabled;
    }
    if (previousWalkthroughEnabled === undefined) {
      delete process.env.LANDING_WALKTHROUGH_ENABLED;
    } else {
      process.env.LANDING_WALKTHROUGH_ENABLED = previousWalkthroughEnabled;
    }
    resetLandingWalkthroughGuardrailsForTests();
    vi.restoreAllMocks();
  });

  it('parses sources with diagnostic reasons', () => {
    expect(parseLandingWalkthroughSourceWithReason('walkthrough_primary')).toEqual({
      source: 'walkthrough_primary',
      reason: 'accepted',
      raw: 'walkthrough_primary',
    });
    expect(parseLandingWalkthroughSourceWithReason('')).toEqual({
      source: 'walkthrough_primary',
      reason: 'missing',
      raw: null,
    });
    expect(parseLandingWalkthroughSourceWithReason('invalid-source')).toEqual({
      source: 'walkthrough_primary',
      reason: 'invalid',
      raw: 'invalid-source',
    });
  });

  it('parses targets with auth-state safety checks', () => {
    expect(
      parseLandingWalkthroughTargetWithReason({ value: '/calendar', authenticated: true }),
    ).toEqual({
      target: '/calendar',
      reason: 'accepted',
      raw: '/calendar',
    });
    expect(
      parseLandingWalkthroughTargetWithReason({ value: '/calendar', authenticated: false }),
    ).toEqual({
      target: '/sign-up',
      reason: 'mismatch',
      raw: '/calendar',
    });
    expect(
      parseLandingWalkthroughTargetWithReason({ value: '/unexpected', authenticated: false }),
    ).toEqual({
      target: '/sign-up',
      reason: 'invalid',
      raw: '/unexpected',
    });
  });

  it('builds deterministic tracked hrefs for walkthrough CTAs', () => {
    expect(
      buildLandingWalkthroughTrackHref({
        source: 'walkthrough_primary',
        target: '/sign-up',
      }),
    ).toBe('/landing/walkthrough/track?target=%2Fsign-up&source=walkthrough_primary');
  });

  it('suppresses duplicate walkthrough view logs without guardrail noise', () => {
    const infoSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logLandingWalkthroughEvent({
      event: 'landing_walkthrough_view',
      surface: '/landing',
      authenticated: false,
      source: 'walkthrough_primary',
    });
    logLandingWalkthroughEvent({
      event: 'landing_walkthrough_view',
      surface: '/landing',
      authenticated: false,
      source: 'walkthrough_primary',
    });

    const infoLines = infoSpy.mock.calls.map((args) => String(args[0]));
    const warnLines = warnSpy.mock.calls.map((args) => String(args[0]));

    expect(
      infoLines.filter((line) => line.includes('"message":"analytics.landing_walkthrough"')).length,
    ).toBe(1);
    expect(warnLines.length).toBe(0);
  });

  it('does not emit walkthrough analytics when analytics are disabled', () => {
    process.env.ANALYTICS_ENABLED = 'false';
    const infoSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    logLandingWalkthroughEvent({
      event: 'landing_walkthrough_cta_click',
      surface: '/landing/walkthrough/track',
      authenticated: true,
      userId: 'user-1',
      source: 'walkthrough_secondary',
      target: '/calendar',
    });

    expect(infoSpy).not.toHaveBeenCalled();
  });
});
