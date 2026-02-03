import { describe, expect, it } from 'vitest';

import { consumeRateLimit } from '../rateLimit';

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

  it('resets after the window passes', () => {
    consumeRateLimit('reset-key', options, 0);
    consumeRateLimit('reset-key', options, 10);

    const afterWindow = consumeRateLimit('reset-key', options, 2000);
    expect(afterWindow.limited).toBe(false);
    expect(afterWindow.remaining).toBe(1);
  });
});
