import { getServerSession } from 'next-auth/next';
import { describe, expect, it, vi } from 'vitest';

import { requireAdminSession } from '../../../../lib/admin/auth';
import { getAdminLogSnapshot } from '../../../../lib/observability/adminLogStore';
import { GET } from '../conversion/route';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/db/prisma', () => ({ prisma: {} }));
vi.mock('../../../../lib/auth/nextauth', () => ({ authOptions: {} }));
vi.mock('../../../../lib/admin/auth', () => ({ requireAdminSession: vi.fn() }));
vi.mock('../../../../lib/observability/adminLogStore', () => ({
  getAdminLogSnapshot: vi.fn(),
  recordAdminLog: vi.fn(),
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedGetAdminLogSnapshot = vi.mocked(getAdminLogSnapshot);

describe('GET /api/admin/conversion', () => {
  it('returns conversion summary for admin sessions', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com' } });
    mockedGetAdminLogSnapshot.mockReturnValue([
      {
        id: 'log-1',
        timestamp: '2026-02-21T10:00:00.000Z',
        level: 'info',
        message: 'analytics.funnel',
        metadata: {
          event: 'landing_page_view',
          userId: 'user-1',
        },
      },
    ]);

    const response = await GET(new Request('https://example.com/api/admin/conversion'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.summary).toBeTruthy();
    expect(body.data.summary.kpis).toHaveLength(3);
    expect(mockedRequireAdminSession).toHaveBeenCalled();

    logSpy.mockRestore();
  });

  it('returns 400 for invalid compare flag', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com' } });
    const response = await GET(
      new Request('https://example.com/api/admin/conversion?compare=not-a-bool'),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('invalid_request');

    errorSpy.mockRestore();
  });

  it('returns 400 for invalid date range', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com' } });
    const response = await GET(
      new Request('https://example.com/api/admin/conversion?start=2026-02-21&end=bad-date'),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('invalid_request');

    errorSpy.mockRestore();
  });

  it('ignores analytics entries that do not match contract event names', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com' } });
    mockedGetAdminLogSnapshot.mockReturnValue([
      {
        id: 'invalid',
        timestamp: '2026-02-21T10:00:00.000Z',
        level: 'info',
        message: 'analytics.funnel',
        metadata: {
          event: 'not_a_contract_event',
          userId: 'user-1',
        },
      },
      {
        id: 'valid',
        timestamp: '2026-02-21T11:00:00.000Z',
        level: 'info',
        message: 'analytics.funnel',
        metadata: {
          event: 'landing_page_view',
          userId: 'user-1',
        },
      },
    ]);

    const response = await GET(
      new Request('https://example.com/api/admin/conversion?start=2026-02-21&end=2026-02-21'),
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    const landingSummary = body.data.summary.events.find(
      (event: { event: string; users: number }) => event.event === 'landing_page_view',
    );
    expect(landingSummary?.users).toBe(1);

    logSpy.mockRestore();
  });
});
