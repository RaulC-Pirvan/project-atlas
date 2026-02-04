import { describe, expect, it } from 'vitest';

import {
  getLatestVerificationToken,
  getLatestVerificationTokenForUser,
  setLatestVerificationToken,
  setLatestVerificationTokenForUser,
} from '../debugTokenStore';

describe('debugTokenStore', () => {
  it('stores tokens by email (case-insensitive)', () => {
    setLatestVerificationToken('User@Example.com', 'token-1');

    expect(getLatestVerificationToken('user@example.com')).toBe('token-1');
  });

  it('stores tokens by user id', () => {
    setLatestVerificationTokenForUser('user-1', 'token-2');

    expect(getLatestVerificationTokenForUser('user-1')).toBe('token-2');
  });
});
