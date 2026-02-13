import { describe, expect, it } from 'vitest';

import {
  validateCompletionWindowDate,
  validateCompletionWindowDateKey,
} from '../completionWindow';
import { utcDate } from './fixtures';

describe('completion window rules', () => {
  it('allows today', () => {
    const validation = validateCompletionWindowDate(utcDate(2026, 2, 12), {
      timeZone: 'UTC',
      now: new Date('2026-02-12T18:00:00.000Z'),
    });

    expect(validation).toEqual({ ok: true });
  });

  it('allows yesterday before 02:00 local time', () => {
    const validation = validateCompletionWindowDate(utcDate(2026, 2, 11), {
      timeZone: 'America/New_York',
      now: new Date('2026-02-12T06:59:00.000Z'),
    });

    expect(validation).toEqual({ ok: true });
  });

  it('blocks yesterday at 02:00 local time', () => {
    const validation = validateCompletionWindowDate(utcDate(2026, 2, 11), {
      timeZone: 'America/New_York',
      now: new Date('2026-02-12T07:00:00.000Z'),
    });

    expect(validation).toEqual({ ok: false, reason: 'grace_expired' });
  });

  it('blocks history older than yesterday', () => {
    const validation = validateCompletionWindowDate(utcDate(2026, 2, 9), {
      timeZone: 'UTC',
      now: new Date('2026-02-12T01:30:00.000Z'),
    });

    expect(validation).toEqual({ ok: false, reason: 'history_blocked' });
  });

  it('blocks future dates', () => {
    const validation = validateCompletionWindowDate(utcDate(2026, 2, 13), {
      timeZone: 'UTC',
      now: new Date('2026-02-12T10:00:00.000Z'),
    });

    expect(validation).toEqual({ ok: false, reason: 'future' });
  });

  it('uses local timezone day boundaries instead of raw UTC dates', () => {
    const validation = validateCompletionWindowDate(utcDate(2026, 2, 12), {
      timeZone: 'America/Los_Angeles',
      now: new Date('2026-02-12T00:30:00.000Z'),
    });

    expect(validation).toEqual({ ok: false, reason: 'future' });
  });

  it('treats DST spring-forward cutoff as grace expired after 01:59 local time', () => {
    const beforeJump = validateCompletionWindowDate(utcDate(2026, 3, 7), {
      timeZone: 'America/New_York',
      now: new Date('2026-03-08T06:59:00.000Z'),
    });
    const afterJump = validateCompletionWindowDate(utcDate(2026, 3, 7), {
      timeZone: 'America/New_York',
      now: new Date('2026-03-08T07:00:00.000Z'),
    });

    expect(beforeJump).toEqual({ ok: true });
    expect(afterJump).toEqual({ ok: false, reason: 'grace_expired' });
  });

  it('returns invalid_date for malformed date keys', () => {
    const validation = validateCompletionWindowDateKey('invalid', {
      timeZone: 'UTC',
    });

    expect(validation).toEqual({ ok: false, reason: 'invalid_date' });
  });

  it('allows history when explicitly enabled', () => {
    const validation = validateCompletionWindowDate(utcDate(2026, 2, 1), {
      timeZone: 'UTC',
      now: new Date('2026-02-12T10:00:00.000Z'),
      allowHistory: true,
    });

    expect(validation).toEqual({ ok: true });
  });
});
