import { getServerSession } from 'next-auth/next';
import { describe, expect, it, vi } from 'vitest';

import { GET } from '../upgrade/route';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../lib/auth/nextauth', () => ({ authOptions: {} }));

const mockedGetServerSession = vi.mocked(getServerSession);

describe('GET /pro/upgrade', () => {
  it('redirects signed-out users to sign-in with preserved upgrade intent', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockedGetServerSession.mockResolvedValueOnce(null);

    const response = await GET(new Request('https://example.com/pro/upgrade?source=comparison'));

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://example.com/sign-in?from=%2Fpro%3Fintent%3Dupgrade%26source%3Dcomparison&intent=pro_upgrade&source=comparison',
    );

    const logLines = logSpy.mock.calls.map((args) => String(args[0]));
    expect(logLines.some((line) => line.includes('"message":"analytics.pro_conversion"'))).toBe(
      true,
    );

    logSpy.mockRestore();
  });

  it('redirects authenticated users straight to checkout', async () => {
    mockedGetServerSession.mockResolvedValueOnce({ user: { id: 'user-1' } });

    const response = await GET(new Request('https://example.com/pro/upgrade?source=faq'));

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://example.com/api/billing/stripe/checkout?source=faq',
    );
  });

  it('falls back to direct source when source is missing', async () => {
    mockedGetServerSession.mockResolvedValueOnce({ user: { id: 'user-2' } });

    const response = await GET(new Request('https://example.com/pro/upgrade'));

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://example.com/api/billing/stripe/checkout?source=direct',
    );
  });
});
