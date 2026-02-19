import { describe, expect, it } from 'vitest';

import {
  shouldRequireSupportCaptcha,
  SUPPORT_CAPTCHA_TRIGGER_ATTEMPTS_PER_HOUR,
  SUPPORT_CAPTCHA_TRIGGER_HONEYPOT_HITS_PER_DAY,
} from '../policy';

describe('support captcha policy', () => {
  it('requires captcha at attempts threshold', () => {
    expect(
      shouldRequireSupportCaptcha({
        attemptsLastHour: SUPPORT_CAPTCHA_TRIGGER_ATTEMPTS_PER_HOUR,
        honeypotHitsLastDay: 0,
      }),
    ).toBe(true);
  });

  it('requires captcha at honeypot threshold', () => {
    expect(
      shouldRequireSupportCaptcha({
        attemptsLastHour: 0,
        honeypotHitsLastDay: SUPPORT_CAPTCHA_TRIGGER_HONEYPOT_HITS_PER_DAY,
      }),
    ).toBe(true);
  });

  it('does not require captcha under thresholds', () => {
    expect(
      shouldRequireSupportCaptcha({
        attemptsLastHour: SUPPORT_CAPTCHA_TRIGGER_ATTEMPTS_PER_HOUR - 1,
        honeypotHitsLastDay: SUPPORT_CAPTCHA_TRIGGER_HONEYPOT_HITS_PER_DAY - 1,
      }),
    ).toBe(false);
  });
});
