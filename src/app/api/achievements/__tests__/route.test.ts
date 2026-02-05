import { getServerSession } from 'next-auth/next';
import { describe, expect, it, vi } from 'vitest';

import { getAchievementsSummary } from '../../../../lib/api/achievements/summary';
import { getProEntitlementSummary } from '../../../../lib/pro/entitlement';
import { GET } from '../route';

const { mockedFindUnique } = vi.hoisted(() => ({
  mockedFindUnique: vi.fn(),
}));

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/db/prisma', () => ({
  prisma: { user: { findUnique: mockedFindUnique } },
}));
vi.mock('../../../../lib/pro/entitlement', () => ({ getProEntitlementSummary: vi.fn() }));
vi.mock('../../../../lib/api/achievements/summary', () => ({ getAchievementsSummary: vi.fn() }));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedGetProEntitlementSummary = vi.mocked(getProEntitlementSummary);
const mockedGetAchievementsSummary = vi.mocked(getAchievementsSummary);

describe('GET /api/achievements', () => {
  it('returns achievements summary for authenticated users', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedFindUnique.mockResolvedValue({ timezone: 'UTC' });
    mockedGetProEntitlementSummary.mockResolvedValue({
      isPro: false,
      status: 'none',
    });
    mockedGetAchievementsSummary.mockResolvedValue({
      generatedAt: new Date('2026-02-04T00:00:00.000Z'),
      achievements: [],
      milestones: [],
      stats: {
        totalCompletions: 0,
        scheduledDays: 0,
        distinctHabits: 0,
        perfectWeeks: 0,
        longestStreak: 0,
        maxHabitCompletions: 0,
      },
    });

    const response = await GET(new Request('https://example.com/api/achievements'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.isPro).toBe(false);

    logSpy.mockRestore();
  });

  it('rejects unauthenticated requests', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue(null);

    const response = await GET(new Request('https://example.com/api/achievements'));
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('unauthorized');

    errorSpy.mockRestore();
  });
});
