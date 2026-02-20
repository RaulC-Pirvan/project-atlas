import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { createUserDataExportAuditFailure, createUserDataExportAuditSuccess } from '../audit';

describe('user data export audit helpers', () => {
  it('writes success audit records with counts', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'audit-1' });
    const prisma = {
      userDataExportAudit: { create },
    };
    const requestedAt = new Date('2026-02-20T10:00:00.000Z');

    await createUserDataExportAuditSuccess({
      prisma,
      userId: 'user-123',
      requestId: 'req-abc',
      requestedAt,
      recordCounts: {
        habits: 1,
        completions: 2,
        reminderSettings: 1,
        habitReminders: 1,
        achievementUnlocks: 3,
        habitMilestoneUnlocks: 4,
      },
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        requestedAt,
        status: 'success',
        format: 'json',
        recordCounts: {
          habits: 1,
          completions: 2,
          reminderSettings: 1,
          habitReminders: 1,
          achievementUnlocks: 3,
          habitMilestoneUnlocks: 4,
        },
        requestId: 'req-abc',
        errorCode: null,
      },
    });
  });

  it('writes failure audit records and normalizes empty request ids', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'audit-2' });
    const prisma = {
      userDataExportAudit: { create },
    };
    const requestedAt = new Date('2026-02-20T10:00:00.000Z');

    await createUserDataExportAuditFailure({
      prisma,
      userId: 'user-456',
      requestId: '   ',
      requestedAt,
      errorCode: 'rate_limited',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user-456',
        requestedAt,
        status: 'failure',
        format: 'json',
        recordCounts: Prisma.DbNull,
        requestId: 'unknown',
        errorCode: 'rate_limited',
      },
    });
  });
});
