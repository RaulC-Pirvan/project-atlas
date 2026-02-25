import { describe, expect, it } from 'vitest';

import { isPublicPath } from '../middleware';

describe('isPublicPath', () => {
  it('allows auth routes and public pages', () => {
    expect(isPublicPath('/sign-in')).toBe(true);
    expect(isPublicPath('/sign-up')).toBe(true);
    expect(isPublicPath('/verify-email')).toBe(true);
    expect(isPublicPath('/landing')).toBe(true);
    expect(isPublicPath('/landing/walkthrough/track')).toBe(true);
    expect(isPublicPath('/pro')).toBe(true);
    expect(isPublicPath('/pro/upgrade')).toBe(true);
    expect(isPublicPath('/support')).toBe(true);
    expect(isPublicPath('/legal/privacy')).toBe(true);
    expect(isPublicPath('/legal/terms')).toBe(true);
    expect(isPublicPath('/legal/refunds')).toBe(true);
    expect(isPublicPath('/legal/changes')).toBe(true);
    expect(isPublicPath('/api/auth/signin')).toBe(true);
    expect(isPublicPath('/api/support/tickets')).toBe(true);
  });

  it('blocks private pages', () => {
    expect(isPublicPath('/account')).toBe(false);
    expect(isPublicPath('/api/account')).toBe(false);
  });
});
