import { getServerSession } from 'next-auth/next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requireAdminSession } from '../../../../lib/admin/auth';
import { recordAdminLog } from '../../../../lib/observability/adminLogStore';
import { POST } from '../debug/conversion/seed/route';

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
const mockedRecordAdminLog = vi.mocked(recordAdminLog);

describe('POST /api/admin/debug/conversion/seed', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedGetServerSession.mockReset();
    mockedRequireAdminSession.mockReset();
    mockedRecordAdminLog.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns 404 when test endpoints are disabled', async () => {
    vi.stubEnv('ENABLE_TEST_ENDPOINTS', 'false');

    const response = await POST(
      new Request('https://example.com/api/admin/debug/conversion/seed', { method: 'POST' }),
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('not_found');
    expect(mockedGetServerSession).not.toHaveBeenCalled();
    expect(mockedRequireAdminSession).not.toHaveBeenCalled();
  });

  it('seeds baseline and active sample events for admins when test mode is enabled', async () => {
    vi.stubEnv('ENABLE_TEST_ENDPOINTS', 'true');
    mockedGetServerSession.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@example.com' },
    });
    mockedRequireAdminSession.mockResolvedValue({
      userId: 'admin-1',
      email: 'admin@example.com',
      twoFactorEnabled: true,
    });

    const response = await POST(
      new Request('https://example.com/api/admin/debug/conversion/seed', { method: 'POST' }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.seeded.totalEvents).toBeGreaterThan(0);
    expect(body.data.seeded.baselineEvents).toBeGreaterThan(0);
    expect(body.data.seeded.activeEvents).toBeGreaterThan(0);

    const payloads = mockedRecordAdminLog.mock.calls.map(
      (call) => call[0] as { message?: string; event?: string },
    );
    const analyticsEvents = payloads.filter(
      (payload) =>
        payload.message === 'analytics.funnel' || payload.message === 'analytics.pro_conversion',
    );

    expect(analyticsEvents).toHaveLength(body.data.seeded.totalEvents);
    expect(analyticsEvents.some((payload) => payload.event === 'landing_page_view')).toBe(true);
    expect(analyticsEvents.some((payload) => payload.event === 'pro_entitlement_active')).toBe(
      true,
    );
  });
});
