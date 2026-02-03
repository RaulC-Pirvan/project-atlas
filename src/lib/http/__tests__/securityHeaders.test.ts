import { describe, expect, it } from 'vitest';

import { applySecurityHeaders } from '../securityHeaders';

describe('applySecurityHeaders', () => {
  it('sets base security headers', () => {
    const headers = new Headers();
    applySecurityHeaders(headers, { isProduction: false });

    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('Permissions-Policy')).toBe(
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    );
    expect(headers.get('X-DNS-Prefetch-Control')).toBe('off');
    expect(headers.get('Strict-Transport-Security')).toBeNull();
  });

  it('adds HSTS in production', () => {
    const headers = new Headers();
    applySecurityHeaders(headers, { isProduction: true });

    expect(headers.get('Strict-Transport-Security')).toBe(
      'max-age=63072000; includeSubDomains; preload',
    );
  });
});
