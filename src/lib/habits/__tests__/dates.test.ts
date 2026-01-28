import { describe, expect, it } from 'vitest';

import { getIsoWeekday, normalizeToUtcDate, parseUtcDateKey } from '../dates';
import { utcDate } from './fixtures';

describe('date helpers', () => {
  it('uses timezone to determine local weekday', () => {
    const instant = new Date('2026-01-05T03:00:00.000Z');

    expect(getIsoWeekday(instant, 'America/Los_Angeles')).toBe(7);
    expect(getIsoWeekday(instant, 'Asia/Tokyo')).toBe(1);
  });

  it('normalizes to utc midnight for the local day', () => {
    const instant = new Date('2026-01-01T00:30:00.000Z');
    const normalized = normalizeToUtcDate(instant, 'America/Los_Angeles');

    expect(normalized.toISOString()).toBe('2025-12-31T00:00:00.000Z');
  });

  it('keeps utc dates stable when timezone is UTC', () => {
    const instant = utcDate(2026, 1, 8);
    const normalized = normalizeToUtcDate(instant, 'UTC');

    expect(normalized.toISOString()).toBe('2026-01-08T00:00:00.000Z');
  });

  it('parses utc date keys', () => {
    const parsed = parseUtcDateKey('2026-02-05');

    expect(parsed?.toISOString()).toBe('2026-02-05T00:00:00.000Z');
    expect(parseUtcDateKey('2026-02-30')).toBeNull();
  });
});
