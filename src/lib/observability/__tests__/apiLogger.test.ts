import { describe, expect, it, vi } from 'vitest';

import { withApiLogging } from '../apiLogger';

describe('withApiLogging', () => {
  it('logs successful responses with status', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const request = new Request('https://example.com/api/test', { method: 'POST' });
    const response = new Response(null, { status: 204 });

    const result = await withApiLogging(request, { route: '/api/test' }, async () => response);

    expect(result.status).toBe(204);
    expect(logSpy).toHaveBeenCalledTimes(1);

    const payload = JSON.parse(logSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(payload.level).toBe('info');
    expect(payload.route).toBe('/api/test');
    expect(payload.status).toBe(204);

    logSpy.mockRestore();
  });

  it('logs error responses with error code', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const request = new Request('https://example.com/api/test', { method: 'GET' });

    const result = await withApiLogging(
      request,
      { route: '/api/test' },
      async () => {
        throw new Error('boom');
      },
      (error) => {
        const response = new Response(JSON.stringify({ ok: false }), { status: 500 });
        return {
          response,
          errorCode: error instanceof Error ? 'internal_error' : 'unknown',
        };
      },
    );

    expect(result.status).toBe(500);
    expect(errorSpy).toHaveBeenCalledTimes(1);

    const payload = JSON.parse(errorSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(payload.level).toBe('error');
    expect(payload.errorCode).toBe('internal_error');
    expect(payload.errorMessage).toBe('boom');

    errorSpy.mockRestore();
  });
});
