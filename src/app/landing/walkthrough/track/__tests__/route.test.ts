import { describe, expect, it, vi } from 'vitest';

const mockedGetServerAuthSession = vi.hoisted(() => vi.fn());

vi.mock('../../../../../lib/auth/session', () => ({
  getServerAuthSession: mockedGetServerAuthSession,
}));

async function loadRoute() {
  const mod = await import('../route');
  return mod.GET;
}

describe('GET /landing/walkthrough/track', () => {
  it('redirects signed-out users to allowed signed-out target', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockedGetServerAuthSession.mockResolvedValueOnce(null);
    const GET = await loadRoute();

    const response = await GET(
      new Request(
        'https://example.com/landing/walkthrough/track?source=walkthrough_secondary&target=%2Fsign-in',
      ),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://example.com/sign-in');

    const logLines = logSpy.mock.calls.map((args) => String(args[0]));
    expect(
      logLines.some((line) => line.includes('"message":"analytics.landing_walkthrough"')),
    ).toBe(true);

    logSpy.mockRestore();
  });

  it('redirects signed-in users to allowed in-app target', async () => {
    mockedGetServerAuthSession.mockResolvedValueOnce({ user: { id: 'user-1' } });
    const GET = await loadRoute();

    const response = await GET(
      new Request(
        'https://example.com/landing/walkthrough/track?source=walkthrough_primary&target=%2Fcalendar',
      ),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://example.com/calendar');
  });

  it('falls back to signed-out safe target for invalid target values', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockedGetServerAuthSession.mockResolvedValueOnce(null);
    const GET = await loadRoute();

    const response = await GET(
      new Request(
        'https://example.com/landing/walkthrough/track?source=walkthrough_primary&target=%2Funexpected',
      ),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://example.com/sign-up');

    const warnLines = warnSpy.mock.calls.map((args) => String(args[0]));
    expect(
      warnLines.some((line) =>
        line.includes('"message":"analytics.landing_walkthrough.guardrail"'),
      ),
    ).toBe(true);

    warnSpy.mockRestore();
  });

  it('falls back source and target when source is invalid and target mismatches auth state', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockedGetServerAuthSession.mockResolvedValueOnce({ user: { id: 'user-2' } });
    const GET = await loadRoute();

    const response = await GET(
      new Request(
        'https://example.com/landing/walkthrough/track?source=%%%invalid%%%&target=%2Fsign-in',
      ),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://example.com/today');

    const logLines = logSpy.mock.calls.map((args) => String(args[0]));
    const warnLines = warnSpy.mock.calls.map((args) => String(args[0]));

    expect(
      logLines.some((line) => line.includes('"message":"analytics.landing_walkthrough"')),
    ).toBe(true);
    expect(
      warnLines.some((line) =>
        line.includes('"message":"analytics.landing_walkthrough.guardrail"'),
      ),
    ).toBe(true);

    logSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
