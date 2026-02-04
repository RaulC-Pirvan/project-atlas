import { describe, expect, it } from 'vitest';

import { ApiError } from '../errors';
import { jsonError, jsonOk } from '../response';

describe('api response helpers', () => {
  it('wraps ok responses', async () => {
    const response = jsonOk({ hello: 'world' }, 201);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true, data: { hello: 'world' } });
  });

  it('wraps error responses with recovery hints', async () => {
    const error = new ApiError('rate_limited', 'Too many requests.', 429);
    const response = jsonError(error);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toEqual({
      code: 'rate_limited',
      message: 'Too many requests.',
      recovery: 'retry_later',
    });
  });
});
