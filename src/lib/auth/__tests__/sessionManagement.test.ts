import { describe, expect, it, vi } from 'vitest';

import {
  findUserSessionById,
  listActiveUserSessions,
  revokeAllUserSessions,
  revokeUserSessionById,
} from '../sessionManagement';

describe('revokeAllUserSessions', () => {
  it('revokes all sessions for a user', async () => {
    const prisma = {
      session: {
        deleteMany: vi.fn().mockResolvedValue({ count: 3 }),
      },
    };

    const result = await revokeAllUserSessions({ prisma, userId: 'user-1' });

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(result).toEqual({ revokedCount: 3 });
  });

  it('keeps current session when exceptSessionToken is provided', async () => {
    const prisma = {
      session: {
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };

    const result = await revokeAllUserSessions({
      prisma,
      userId: 'user-1',
      exceptSessionToken: 'current-session',
    });

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        sessionToken: { not: 'current-session' },
      },
    });
    expect(result).toEqual({ revokedCount: 2 });
  });
});

describe('revokeUserSessionById', () => {
  it('revokes only the targeted session for the user', async () => {
    const prisma = {
      session: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const result = await revokeUserSessionById({
      prisma,
      userId: 'user-1',
      sessionId: 'session-1',
    });

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
        userId: 'user-1',
      },
    });
    expect(result).toEqual({ revokedCount: 1 });
  });
});

describe('listActiveUserSessions', () => {
  it('returns active sessions ordered by last activity', async () => {
    const now = new Date('2026-02-17T12:00:00.000Z');
    const sessions = [
      {
        id: 'session-1',
        sessionToken: 'token-1',
        expires: new Date('2026-02-18T12:00:00.000Z'),
        lastActiveAt: new Date('2026-02-17T11:00:00.000Z'),
        createdAt: new Date('2026-02-17T10:00:00.000Z'),
        ipAddress: '203.0.113.1',
        userAgent: 'browser-a',
      },
    ];

    const prisma = {
      session: {
        findMany: vi.fn().mockResolvedValue(sessions),
      },
    };

    const result = await listActiveUserSessions({
      prisma,
      userId: 'user-1',
      now,
    });

    expect(prisma.session.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        expires: { gt: now },
      },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        sessionToken: true,
        expires: true,
        lastActiveAt: true,
        createdAt: true,
        ipAddress: true,
        userAgent: true,
      },
    });
    expect(result).toEqual(sessions);
  });
});

describe('findUserSessionById', () => {
  it('returns a user-owned session when it exists', async () => {
    const prisma = {
      session: {
        findFirst: vi.fn().mockResolvedValue({ id: 'session-1', sessionToken: 'token-1' }),
      },
    };

    const result = await findUserSessionById({
      prisma,
      userId: 'user-1',
      sessionId: 'session-1',
    });

    expect(prisma.session.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
        userId: 'user-1',
      },
      select: {
        id: true,
        sessionToken: true,
      },
    });
    expect(result).toEqual({ id: 'session-1', sessionToken: 'token-1' });
  });
});
