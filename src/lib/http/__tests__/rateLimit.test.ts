import { describe, expect, it } from 'vitest';

import {
  applyRateLimitHeaders,
  consumeRateLimit,
  getClientIp,
  getRateLimitKey,
} from '../rateLimit';

describe('consumeRateLimit', () => {
  const options = { windowMs: 1000, max: 2, blockMs: 2000 };

  it('allows up to the max within the window', () => {
    const first = consumeRateLimit('key', options, 0);
    const second = consumeRateLimit('key', options, 10);

    expect(first.limited).toBe(false);
    expect(first.remaining).toBe(1);
    expect(second.limited).toBe(false);
    expect(second.remaining).toBe(0);
  });

  it('blocks once the max is exceeded', () => {
    consumeRateLimit('block-key', options, 0);
    consumeRateLimit('block-key', options, 10);
    const limited = consumeRateLimit('block-key', options, 20);

    expect(limited.limited).toBe(true);
    expect(limited.retryAfterSeconds).toBe(2);
  });

  it('returns a blocked decision while still in the blocked window', () => {
    consumeRateLimit('blocked', options, 0);
    consumeRateLimit('blocked', options, 10);
    const firstBlock = consumeRateLimit('blocked', options, 20);

    const stillBlocked = consumeRateLimit('blocked', options, firstBlock.resetAt - 500);

    expect(stillBlocked.limited).toBe(true);
    expect(stillBlocked.remaining).toBe(0);
    expect(stillBlocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('resets after the window passes', () => {
    consumeRateLimit('reset-key', options, 0);
    consumeRateLimit('reset-key', options, 10);

    const afterWindow = consumeRateLimit('reset-key', options, 2000);
    expect(afterWindow.limited).toBe(false);
    expect(afterWindow.remaining).toBe(1);
  });
});

describe('rate limit helpers', () => {
  it('derives client ip from forwarded headers', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' },
    });

    expect(getClientIp(request)).toBe('1.1.1.1');
  });

  it('falls back to real ip headers', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-real-ip': '3.3.3.3' },
    });

    expect(getClientIp(request)).toBe('3.3.3.3');
  });

  it('falls back to cf-connecting-ip and defaults to unknown', () => {
    const request = new Request('https://example.com', {
      headers: { 'cf-connecting-ip': '4.4.4.4' },
    });
    const requestUnknown = new Request('https://example.com');

    expect(getClientIp(request)).toBe('4.4.4.4');
    expect(getClientIp(requestUnknown)).toBe('unknown');
  });

  it('builds a stable rate limit key', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '5.5.5.5' },
    });

    expect(getRateLimitKey('/api/auth', request)).toBe('/api/auth:5.5.5.5');
  });

  it('applies rate limit headers', () => {
    const headers = new Headers();
    applyRateLimitHeaders(headers, {
      limited: true,
      limit: 5,
      remaining: 0,
      resetAt: 10000,
      retryAfterSeconds: 2,
    });

    expect(headers.get('X-RateLimit-Limit')).toBe('5');
    expect(headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(headers.get('X-RateLimit-Reset')).toBe('10');
    expect(headers.get('Retry-After')).toBe('2');
  });
});
