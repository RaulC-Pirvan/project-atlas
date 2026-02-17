import { describe, expect, it, vi } from 'vitest';

import { revokeAllUserSessions } from '../sessionManagement';

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
