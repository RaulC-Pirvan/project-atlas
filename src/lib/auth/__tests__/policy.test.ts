import { describe, expect, it } from 'vitest';

import { canLogin } from '../policy';

describe('login policy', () => {
  it('allows verified accounts', () => {
    expect(canLogin({ emailVerified: new Date() })).toBe(true);
  });

  it('rejects unverified accounts', () => {
    expect(canLogin({ emailVerified: null })).toBe(false);
  });

  it('rejects soft-deleted accounts even if verified', () => {
    expect(canLogin({ emailVerified: new Date(), deletedAt: new Date() })).toBe(false);
  });
});
