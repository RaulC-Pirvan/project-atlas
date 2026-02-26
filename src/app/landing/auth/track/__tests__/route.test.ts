import { describe, expect, it, vi } from 'vitest';

const mockedGetServerAuthSession = vi.hoisted(() => vi.fn());

vi.mock('../../../../../lib/auth/session', () => ({
  getServerAuthSession: mockedGetServerAuthSession,
}));

async function loadRoute() {
  const mod = await import('../route');
  return mod.GET;
}

describe('GET /landing/auth/track', () => {
  it('redirects to sign-up with analytics event for valid params', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockedGetServerAuthSession.mockResolvedValueOnce(null);
    const GET = await loadRoute();

    const response = await GET(
      new Request('https://example.com/landing/auth/track?source=hero_primary&target=%2Fsign-up'),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://example.com/sign-up');

    const logLines = logSpy.mock.calls.map((args) => String(args[0]));
    expect(logLines.some((line) => line.includes('"message":"analytics.funnel"'))).toBe(true);

    logSpy.mockRestore();
  });

  it('redirects to sign-in for valid sign-in target', async () => {
    mockedGetServerAuthSession.mockResolvedValueOnce({ user: { id: 'user-1' } });
    const GET = await loadRoute();

    const response = await GET(
      new Request('https://example.com/landing/auth/track?source=header_sign_in&target=%2Fsign-in'),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://example.com/sign-in');
  });

  it('falls back to defaults and emits guardrail for invalid source and target', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockedGetServerAuthSession.mockResolvedValueOnce(null);
    const GET = await loadRoute();

    const response = await GET(
      new Request(
        'https://example.com/landing/auth/track?source=%%%invalid%%%&target=%2Funexpected',
      ),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://example.com/sign-up');

    const logLines = logSpy.mock.calls.map((args) => String(args[0]));
    const warnLines = warnSpy.mock.calls.map((args) => String(args[0]));
    expect(logLines.some((line) => line.includes('"message":"analytics.funnel"'))).toBe(true);
    expect(warnLines.some((line) => line.includes('"message":"analytics.funnel.guardrail"'))).toBe(
      true,
    );

    logSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
