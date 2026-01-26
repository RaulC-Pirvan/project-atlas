import { describe, expect, it } from 'vitest';

import { hashToken, isExpired } from '../tokens';

describe('verification token helpers', () => {
  it('hashToken is deterministic', () => {
    const a = hashToken('token-123');
    const b = hashToken('token-123');
    expect(a).toBe(b);
  });

  it('hashToken changes if input changes', () => {
    const a = hashToken('token-123');
    const b = hashToken('token-124');

    expect(a).not.toBe(b);
  });

  it('isExpired returns false for future expiry', () => {
    const now = new Date('2026-01-25T10:00:00.000Z');
    const future = new Date('2026-01-25T10:05:00.000Z');

    expect(isExpired(future, now)).toBe(false);
  });

  it('isExpired returns true for past expiry', () => {
    const now = new Date('2026-01-25T10:00:00.000Z');
    const past = new Date('2026-01-25T09:00:00.000Z');

    expect(isExpired(past, now)).toBe(true);
  });

  it('isExpired treats exact now as expired', () => {
    const now = new Date('2026-01-25T10:00:00.000Z');

    expect(isExpired(now, now)).toBe(true);
  });
});
