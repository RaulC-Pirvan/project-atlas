import { describe, expect, it, vi } from 'vitest';

import { resolveGoogleOAuthSignIn } from '../googleOAuth';

function createPrismaMock() {
  return {
    account: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe('resolveGoogleOAuthSignIn', () => {
  it('links Google account to an existing active user and verifies email when needed', async () => {
    const now = new Date('2026-02-16T10:00:00.000Z');
    const prisma = createPrismaMock();

    prisma.account.findUnique.mockResolvedValueOnce(null);
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: null,
      displayName: 'Atlas User',
      role: 'user',
      deletedAt: null,
    });
    prisma.user.update.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: now,
      displayName: 'Atlas User',
      role: 'user',
      deletedAt: null,
    });
    prisma.account.create.mockResolvedValueOnce({ id: 'account-1' });

    const result = await resolveGoogleOAuthSignIn({
      prisma,
      input: {
        providerAccountId: 'google-sub-1',
        email: 'User@Example.com',
        emailVerified: true,
        name: 'Atlas User',
        account: { type: 'oauth' },
        now,
      },
    });

    expect(result).toEqual({
      ok: true,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        emailVerified: now,
        name: 'Atlas User',
        isAdmin: false,
      },
    });
    expect(prisma.user.update).toHaveBeenCalledOnce();
    expect(prisma.account.create).toHaveBeenCalledOnce();
  });

  it('rejects Google profiles without verified email', async () => {
    const prisma = createPrismaMock();
    prisma.account.findUnique.mockResolvedValueOnce(null);

    const result = await resolveGoogleOAuthSignIn({
      prisma,
      input: {
        providerAccountId: 'google-sub-2',
        email: 'user@example.com',
        emailVerified: false,
        name: 'User',
        account: { type: 'oauth' },
      },
    });

    expect(result).toEqual({ ok: false, reason: 'email_not_verified' });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.account.create).not.toHaveBeenCalled();
  });

  it('blocks sign-in when the matched email belongs to a deleted user', async () => {
    const prisma = createPrismaMock();
    prisma.account.findUnique.mockResolvedValueOnce(null);
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-2',
      email: 'user@example.com',
      emailVerified: new Date('2026-01-01T00:00:00.000Z'),
      displayName: 'Deleted User',
      role: 'user',
      deletedAt: new Date('2026-02-01T00:00:00.000Z'),
    });

    const result = await resolveGoogleOAuthSignIn({
      prisma,
      input: {
        providerAccountId: 'google-sub-3',
        email: 'user@example.com',
        emailVerified: true,
        name: 'User',
        account: { type: 'oauth' },
      },
    });

    expect(result).toEqual({ ok: false, reason: 'deleted_user' });
    expect(prisma.account.create).not.toHaveBeenCalled();
  });

  it('creates a new user and linked account when no email match exists', async () => {
    const now = new Date('2026-02-16T12:00:00.000Z');
    const prisma = createPrismaMock();

    prisma.account.findUnique.mockResolvedValueOnce(null);
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValueOnce({
      id: 'user-3',
      email: 'new@example.com',
      emailVerified: now,
      displayName: 'New User',
      role: 'user',
      deletedAt: null,
    });
    prisma.account.create.mockResolvedValueOnce({ id: 'account-3' });

    const result = await resolveGoogleOAuthSignIn({
      prisma,
      input: {
        providerAccountId: 'google-sub-4',
        email: 'new@example.com',
        emailVerified: true,
        name: 'New User',
        account: { type: 'oauth' },
        now,
      },
    });

    expect(result).toEqual({
      ok: true,
      user: {
        id: 'user-3',
        email: 'new@example.com',
        emailVerified: now,
        name: 'New User',
        isAdmin: false,
      },
    });
    expect(prisma.user.create).toHaveBeenCalledOnce();
    expect(prisma.account.create).toHaveBeenCalledOnce();
  });

  it('rejects account-link conflicts when providerAccountId is already linked elsewhere', async () => {
    const now = new Date('2026-02-16T12:30:00.000Z');
    const prisma = createPrismaMock();

    prisma.account.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      userId: 'another-user',
      user: {
        id: 'another-user',
        email: 'another@example.com',
        emailVerified: now,
        displayName: 'Another User',
        role: 'user',
        deletedAt: null,
      },
    });
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-4',
      email: 'user4@example.com',
      emailVerified: now,
      displayName: 'User Four',
      role: 'user',
      deletedAt: null,
    });
    prisma.account.create.mockRejectedValueOnce(new Error('Unique constraint failed.'));

    const result = await resolveGoogleOAuthSignIn({
      prisma,
      input: {
        providerAccountId: 'google-sub-conflict',
        email: 'user4@example.com',
        emailVerified: true,
        name: 'User Four',
        account: { type: 'oauth' },
        now,
      },
    });

    expect(result).toEqual({ ok: false, reason: 'account_conflict' });
  });
});
