import { getServerSession } from 'next-auth/next';
import { describe, expect, it, vi } from 'vitest';

import { getInsightsSummary } from '../../../../lib/api/insights/summary';
import { getProEntitlementSummary } from '../../../../lib/pro/entitlement';
import { GET } from '../route';

const mockedFindUnique = vi.fn();

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/db/prisma', () => ({
  prisma: { user: { findUnique: mockedFindUnique } },
}));
vi.mock('../../../../lib/pro/entitlement', () => ({ getProEntitlementSummary: vi.fn() }));
vi.mock('../../../../lib/api/insights/summary', () => ({ getInsightsSummary: vi.fn() }));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedGetProEntitlementSummary = vi.mocked(getProEntitlementSummary);
const mockedGetInsightsSummary = vi.mocked(getInsightsSummary);

describe('GET /api/insights', () => {
  it('returns insights summary for Pro users', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedFindUnique.mockResolvedValue({ timezone: 'UTC' });
    mockedGetProEntitlementSummary.mockResolvedValue({
      isPro: true,
      status: 'active',
      source: 'manual',
      restoredAt: null,
      updatedAt: new Date('2026-02-04T00:00:00.000Z'),
    });
    mockedGetInsightsSummary.mockResolvedValue({
      generatedAt: new Date('2026-02-04T00:00:00.000Z'),
      consistency: [
        { windowDays: 7, scheduled: 7, completed: 5, rate: 5 / 7 },
        { windowDays: 30, scheduled: 30, completed: 10, rate: 1 / 3 },
        { windowDays: 90, scheduled: 90, completed: 20, rate: 2 / 9 },
      ],
      weekdayStats: {
        best: { weekday: 1, label: 'Monday', scheduled: 10, completed: 8, rate: 0.8 },
        worst: { weekday: 2, label: 'Tuesday', scheduled: 10, completed: 2, rate: 0.2 },
        stats: [{ weekday: 1, label: 'Monday', scheduled: 10, completed: 8, rate: 0.8 }],
      },
      trend: {
        windowDays: 14,
        currentRate: 0.8,
        previousRate: 0.6,
        delta: 0.2,
        direction: 'up',
      },
      heatmap: {
        weeks: 12,
        weekdays: 7,
        values: Array.from({ length: 7 }, () => Array(12).fill(0)),
      },
    });

    const response = await GET(new Request('https://example.com/api/insights'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.weekdayStats.best.label).toBe('Monday');

    logSpy.mockRestore();
  });

  it('rejects non-Pro users', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedFindUnique.mockResolvedValue({ timezone: 'UTC' });
    mockedGetProEntitlementSummary.mockResolvedValue({
      isPro: false,
      status: 'none',
    });

    const response = await GET(new Request('https://example.com/api/insights'));
    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('forbidden');

    errorSpy.mockRestore();
  });

  it('rejects unauthenticated requests', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue(null);

    const response = await GET(new Request('https://example.com/api/insights'));
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('unauthorized');

    errorSpy.mockRestore();
  });
});
