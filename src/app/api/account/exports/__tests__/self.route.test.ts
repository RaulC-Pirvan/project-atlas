import { getServerSession } from 'next-auth/next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildUserDataExportFilename } from '../../../../../lib/account/exports/filename';
import { getUserDataExportPayload } from '../../../../../lib/account/exports/payload';
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

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedGetUserDataExportPayload = vi.mocked(getUserDataExportPayload);
const mockedBuildUserDataExportFilename = vi.mocked(buildUserDataExportFilename);

describe('GET /api/account/exports/self', () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
    mockedGetUserDataExportPayload.mockReset();
    mockedBuildUserDataExportFilename.mockReset();
  });

  it('returns downloadable json for authenticated users', async () => {
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

    const response = await GET(new Request('https://example.com/api/account/exports/self'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect(response.headers.get('Content-Disposition')).toBe(
      'attachment; filename="20260220T100000Z-atlas-data-export.json"',
    );
    expect(response.headers.get('Cache-Control')).toBe('no-store');

    expect(mockedGetUserDataExportPayload).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
    );

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

    errorSpy.mockRestore();
  });
});
