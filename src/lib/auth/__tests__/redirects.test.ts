import { describe, expect, it } from 'vitest';

import { DEFAULT_POST_AUTH_PATH, resolveSafePostAuthPath } from '../redirects';

describe('resolveSafePostAuthPath', () => {
  it('uses default for empty values', () => {
    expect(resolveSafePostAuthPath(null)).toBe(DEFAULT_POST_AUTH_PATH);
    expect(resolveSafePostAuthPath(undefined)).toBe(DEFAULT_POST_AUTH_PATH);
    expect(resolveSafePostAuthPath('')).toBe(DEFAULT_POST_AUTH_PATH);
  });

  it('allows in-app relative paths', () => {
    expect(resolveSafePostAuthPath('/calendar')).toBe('/calendar');
    expect(resolveSafePostAuthPath('/pro?intent=upgrade&source=hero')).toBe(
      '/pro?intent=upgrade&source=hero',
    );
  });

  it('rejects unsafe redirects', () => {
    expect(resolveSafePostAuthPath('https://example.com')).toBe(DEFAULT_POST_AUTH_PATH);
    expect(resolveSafePostAuthPath('//example.com')).toBe(DEFAULT_POST_AUTH_PATH);
    expect(resolveSafePostAuthPath('/api/billing/stripe/checkout')).toBe(DEFAULT_POST_AUTH_PATH);
    expect(resolveSafePostAuthPath('/\\evil')).toBe(DEFAULT_POST_AUTH_PATH);
  });
});
