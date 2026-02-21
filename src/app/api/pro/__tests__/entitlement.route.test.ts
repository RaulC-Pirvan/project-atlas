import { getServerSession } from 'next-auth/next';
import { describe, expect, it, vi } from 'vitest';

import { getProEntitlementSummary } from '../../../../lib/pro/entitlement';
import { GET } from '../entitlement/route';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/db/prisma', () => ({ prisma: {} }));
vi.mock('../../../../lib/pro/entitlement', () => ({ getProEntitlementSummary: vi.fn() }));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedGetProEntitlementSummary = vi.mocked(getProEntitlementSummary);

describe('GET /api/pro/entitlement', () => {
  it('returns entitlement summary for authenticated user', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetProEntitlementSummary.mockResolvedValue({
      isPro: true,
      status: 'active',
      source: 'manual',
      restoredAt: null,
      updatedAt: new Date('2026-02-04T00:00:00.000Z'),
    });

    const response = await GET(new Request('https://example.com/api/pro/entitlement'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.isPro).toBe(true);
    expect(body.data.status).toBe('active');

    logSpy.mockRestore();
  });

  it('returns provider-aware projection fields with iso timestamps', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetProEntitlementSummary.mockResolvedValue({
      isPro: true,
      status: 'active',
      source: 'stripe',
      restoredAt: new Date('2026-02-06T00:00:00.000Z'),
      updatedAt: new Date('2026-02-07T00:00:00.000Z'),
    });

    const response = await GET(new Request('https://example.com/api/pro/entitlement'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data).toEqual({
      isPro: true,
      status: 'active',
      source: 'stripe',
      restoredAt: '2026-02-06T00:00:00.000Z',
      updatedAt: '2026-02-07T00:00:00.000Z',
    });

    logSpy.mockRestore();
  });

  it('rejects unauthenticated requests', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue(null);

    const response = await GET(new Request('https://example.com/api/pro/entitlement'));
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('unauthorized');

    errorSpy.mockRestore();
  });
});
