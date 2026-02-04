import { describe, expect, it, vi } from 'vitest';

import { GET } from '../health/route';

describe('GET /api/health', () => {
  it('returns ok status with timestamp and uptime', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const response = await GET(new Request('https://example.com/api/health'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(typeof body.data.timestamp).toBe('string');
    expect(typeof body.data.uptimeSeconds).toBe('number');

    logSpy.mockRestore();
  });
});
