import { describe, expect, it } from 'vitest';

import { toUtcDateKey } from '../dates';
import {
  buildQueueItem,
  normalizeQueueItems,
  upsertQueueItem,
  validateCompletionDate,
} from '../offlineQueue';
import { utcDate } from './fixtures';

describe('offline completion queue', () => {
  it('dedupes queue items by key with last-write-wins', () => {
    const base = {
      key: 'habit-a:2026-02-11',
      habitId: 'habit-a',
      dateKey: '2026-02-11',
      completed: true,
      createdAt: 100,
      updatedAt: 100,
    };
    const newer = { ...base, completed: false, updatedAt: 200 };

    const normalized = normalizeQueueItems([base, newer]);
    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.completed).toBe(false);
    expect(normalized[0]?.updatedAt).toBe(200);
  });

  it('upserts queue items by key', () => {
    const first = buildQueueItem({
      habitId: 'habit-b',
      dateKey: '2026-02-12',
      completed: true,
      now: new Date(0),
    });
    const next = buildQueueItem({
      habitId: 'habit-b',
      dateKey: '2026-02-12',
      completed: false,
      now: new Date(1000),
      previous: first,
    });

    const result = upsertQueueItem([first], next);
    expect(result).toHaveLength(1);
    expect(result[0]?.completed).toBe(false);
    expect(result[0]?.createdAt).toBe(first.createdAt);
    expect(result[0]?.updatedAt).toBe(next.updatedAt);
  });

  it('rejects invalid date keys', () => {
    const validation = validateCompletionDate('invalid-date', {
      timeZone: 'UTC',
    });
    expect(validation.ok).toBe(false);
    if (!validation.ok) {
      expect(validation.reason).toBe('invalid_date');
    }
  });

  it('rejects future dates', () => {
    const validation = validateCompletionDate('2026-02-13', {
      timeZone: 'UTC',
      now: new Date('2026-02-12T10:00:00.000Z'),
      allowHistory: true,
    });
    expect(validation.ok).toBe(false);
    if (!validation.ok) {
      expect(validation.reason).toBe('future');
    }
  });

  it('allows yesterday before grace cutoff when history is blocked', () => {
    const yesterdayKey = toUtcDateKey(utcDate(2026, 2, 11));
    const validation = validateCompletionDate(yesterdayKey, {
      timeZone: 'America/New_York',
      now: new Date('2026-02-12T06:30:00.000Z'),
      allowHistory: false,
    });
    expect(validation.ok).toBe(true);
  });

  it('blocks yesterday after grace cutoff when history is blocked', () => {
    const yesterdayKey = toUtcDateKey(utcDate(2026, 2, 11));
    const validation = validateCompletionDate(yesterdayKey, {
      timeZone: 'America/New_York',
      now: new Date('2026-02-12T08:00:00.000Z'),
      allowHistory: false,
    });
    expect(validation.ok).toBe(false);
    if (!validation.ok) {
      expect(validation.reason).toBe('grace_expired');
    }
  });

  it('allows history when configured', () => {
    const olderKey = toUtcDateKey(utcDate(2026, 2, 9));
    const validation = validateCompletionDate(olderKey, {
      timeZone: 'America/New_York',
      now: new Date('2026-02-12T08:00:00.000Z'),
      allowHistory: true,
    });
    expect(validation.ok).toBe(true);
  });
});
