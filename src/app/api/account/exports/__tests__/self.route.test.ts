import { getServerSession } from 'next-auth/next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createUserDataExportAuditFailure,
  createUserDataExportAuditSuccess,
} from '../../../../../lib/account/exports/audit';
import { buildUserDataExportFilename } from '../../../../../lib/account/exports/filename';
import { getUserDataExportPayload } from '../../../../../lib/account/exports/payload';
import {
  getAccountExportRateLimitKey,
  shouldBypassAccountExportRateLimit,
} from '../../../../../lib/account/exports/rateLimit';
import { summarizeUserDataExportRecordCounts } from '../../../../../lib/account/exports/recordCounts';
import { applyRateLimitHeaders, consumeRateLimit } from '../../../../../lib/http/rateLimit';
import { GET } from '../self/route';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../../lib/auth/nextauth', () => ({ authOptions: {} }));
vi.mock('../../../../../lib/db/prisma', () => ({ prisma: {} }));
vi.mock('../../../../../lib/account/exports/payload', () => ({
  getUserDataExportPayload: vi.fn(),
}));
vi.mock('../../../../../lib/account/exports/filename', () => ({
  buildUserDataExportFilename: vi.fn(),
}));
vi.mock('../../../../../lib/account/exports/recordCounts', () => ({
  summarizeUserDataExportRecordCounts: vi.fn(),
}));
vi.mock('../../../../../lib/account/exports/audit', () => ({
  createUserDataExportAuditSuccess: vi.fn(),
  createUserDataExportAuditFailure: vi.fn(),
}));
vi.mock('../../../../../lib/account/exports/rateLimit', () => ({
  ACCOUNT_EXPORT_RATE_LIMIT: { windowMs: 1000 * 60 * 15, max: 3, blockMs: 1000 * 60 * 15 },
  getAccountExportRateLimitKey: vi.fn(),
  shouldBypassAccountExportRateLimit: vi.fn(),
}));
vi.mock('../../../../../lib/http/rateLimit', () => ({
  consumeRateLimit: vi.fn(),
  applyRateLimitHeaders: vi.fn((headers: Headers) => {
    headers.set('Retry-After', '60');
  }),
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedGetUserDataExportPayload = vi.mocked(getUserDataExportPayload);
const mockedBuildUserDataExportFilename = vi.mocked(buildUserDataExportFilename);
const mockedSummarizeUserDataExportRecordCounts = vi.mocked(summarizeUserDataExportRecordCounts);
const mockedCreateUserDataExportAuditSuccess = vi.mocked(createUserDataExportAuditSuccess);
const mockedCreateUserDataExportAuditFailure = vi.mocked(createUserDataExportAuditFailure);
const mockedGetAccountExportRateLimitKey = vi.mocked(getAccountExportRateLimitKey);
const mockedShouldBypassAccountExportRateLimit = vi.mocked(shouldBypassAccountExportRateLimit);
const mockedConsumeRateLimit = vi.mocked(consumeRateLimit);
const mockedApplyRateLimitHeaders = vi.mocked(applyRateLimitHeaders);

describe('GET /api/account/exports/self', () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
    mockedGetUserDataExportPayload.mockReset();
    mockedBuildUserDataExportFilename.mockReset();
    mockedSummarizeUserDataExportRecordCounts.mockReset();
    mockedCreateUserDataExportAuditSuccess.mockReset();
    mockedCreateUserDataExportAuditFailure.mockReset();
    mockedGetAccountExportRateLimitKey.mockReset();
    mockedShouldBypassAccountExportRateLimit.mockReset();
    mockedConsumeRateLimit.mockReset();
    mockedApplyRateLimitHeaders.mockReset();

    mockedGetAccountExportRateLimitKey.mockReturnValue('account:exports:self:user-1');
    mockedShouldBypassAccountExportRateLimit.mockReturnValue(true);
    mockedSummarizeUserDataExportRecordCounts.mockReturnValue({
      habits: 1,
      completions: 2,
      reminderSettings: 1,
      habitReminders: 3,
      achievementUnlocks: 4,
      habitMilestoneUnlocks: 5,
    });
  });

  it('returns downloadable json for authenticated users and writes success audit', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetUserDataExportPayload.mockResolvedValue({
      schemaVersion: 1,
      generatedAt: '2026-02-20T10:00:00.000Z',
      userId: 'user-1',
      habits: [],
      completions: [],
      reminders: {
        settings: {
          dailyDigestEnabled: true,
          dailyDigestTimeMinutes: 1200,
          quietHoursEnabled: false,
          quietHoursStartMinutes: 1320,
          quietHoursEndMinutes: 420,
          snoozeDefaultMinutes: 10,
        },
        habitReminders: [],
      },
      achievements: {
        achievementUnlocks: [],
        habitMilestoneUnlocks: [],
      },
    });
    mockedBuildUserDataExportFilename.mockReturnValue('20260220T100000Z-atlas-data-export.json');

    const response = await GET(
      new Request('https://example.com/api/account/exports/self', {
        headers: { 'x-request-id': 'req-export-1' },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="20260220T100000Z-atlas-data-export.json"',
    );
    expect(response.headers.get('Cache-Control')).toBe('no-store');

    expect(mockedGetUserDataExportPayload).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
    );
    expect(mockedSummarizeUserDataExportRecordCounts).toHaveBeenCalled();
    expect(mockedCreateUserDataExportAuditSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        requestId: 'req-export-1',
        recordCounts: {
          habits: 1,
          completions: 2,
          reminderSettings: 1,
          habitReminders: 3,
          achievementUnlocks: 4,
          habitMilestoneUnlocks: 5,
        },
      }),
    );
    expect(mockedCreateUserDataExportAuditFailure).not.toHaveBeenCalled();

    await expect(response.json()).resolves.toMatchObject({ userId: 'user-1' });

    logSpy.mockRestore();
  });

  it('rejects unauthenticated requests', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue(null);

    const response = await GET(new Request('https://example.com/api/account/exports/self'));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('unauthorized');
    expect(mockedGetUserDataExportPayload).not.toHaveBeenCalled();
    expect(mockedCreateUserDataExportAuditSuccess).not.toHaveBeenCalled();
    expect(mockedCreateUserDataExportAuditFailure).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('returns 429 with rate-limit handling and writes failure audit', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedShouldBypassAccountExportRateLimit.mockReturnValue(false);
    mockedConsumeRateLimit.mockReturnValue({
      limited: true,
      limit: 3,
      remaining: 0,
      resetAt: Date.now() + 60_000,
      retryAfterSeconds: 60,
    });

    const response = await GET(
      new Request('https://example.com/api/account/exports/self', {
        headers: { 'x-correlation-id': 'corr-export-1' },
      }),
    );

    expect(response.status).toBe(429);
    expect(mockedGetAccountExportRateLimitKey).toHaveBeenCalledWith('user-1');
    expect(mockedConsumeRateLimit).toHaveBeenCalled();
    expect(mockedApplyRateLimitHeaders).toHaveBeenCalled();
    expect(response.headers.get('Retry-After')).toBe('60');

    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('rate_limited');

    expect(mockedGetUserDataExportPayload).not.toHaveBeenCalled();
    expect(mockedCreateUserDataExportAuditSuccess).not.toHaveBeenCalled();
    expect(mockedCreateUserDataExportAuditFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        requestId: 'corr-export-1',
        errorCode: 'rate_limited',
      }),
    );

    logSpy.mockRestore();
  });

  it('returns sanitized internal error and writes failure audit when export assembly fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockedGetServerSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockedGetUserDataExportPayload.mockRejectedValue(new Error('database failed: secret details'));

    const response = await GET(
      new Request('https://example.com/api/account/exports/self', {
        headers: { 'x-request-id': 'req-export-2' },
      }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('internal_error');
    expect(body.error.message).toBe('Internal server error.');

    expect(mockedCreateUserDataExportAuditSuccess).not.toHaveBeenCalled();
    expect(mockedCreateUserDataExportAuditFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        requestId: 'req-export-2',
        errorCode: 'internal_error',
      }),
    );

    errorSpy.mockRestore();
  });
});
