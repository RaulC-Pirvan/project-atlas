import { hashPassword } from './password';
import { generateToken } from './tokens';

type StoredUser = {
  id: string;
  email: string;
  emailVerified: Date | null;
  displayName: string;
  role: 'user' | 'admin';
  deletedAt: Date | null;
};

type VerifiedStoredUser = Omit<StoredUser, 'emailVerified'> & {
  emailVerified: Date;
};

type StoredAccount = {
  userId: string;
  user: StoredUser;
};

type PrismaClientLike = {
  user: {
    findUnique: (args: {
      where: { email: string };
      select: {
        id: true;
        email: true;
        emailVerified: true;
        displayName: true;
        role: true;
        deletedAt: true;
      };
    }) => Promise<StoredUser | null>;
    create: (args: {
      data: {
        email: string;
        emailVerified: Date;
        passwordHash: string;
        displayName: string;
      };
      select: {
        id: true;
        email: true;
        emailVerified: true;
        displayName: true;
        role: true;
        deletedAt: true;
      };
    }) => Promise<StoredUser>;
    update: (args: {
      where: { id: string };
      data: { emailVerified: Date };
      select: {
        id: true;
        email: true;
        emailVerified: true;
        displayName: true;
        role: true;
        deletedAt: true;
      };
    }) => Promise<StoredUser>;
  };
  account: {
    findUnique: (args: {
      where: {
        provider_providerAccountId: {
          provider: string;
          providerAccountId: string;
        };
      };
      select: {
        userId: true;
        user: {
          select: {
            id: true;
            email: true;
            emailVerified: true;
            displayName: true;
            role: true;
            deletedAt: true;
          };
        };
      };
    }) => Promise<StoredAccount | null>;
    create: (args: {
      data: {
        userId: string;
        type: string;
        provider: string;
        providerAccountId: string;
        refresh_token?: string | null;
        access_token?: string | null;
        expires_at?: number | null;
        token_type?: string | null;
        scope?: string | null;
        id_token?: string | null;
        session_state?: string | null;
      };
    }) => Promise<{ id: string }>;
  };
};

export type GoogleOAuthDeniedReason =
  | 'missing_provider_account_id'
  | 'missing_email'
  | 'email_not_verified'
  | 'deleted_user'
  | 'account_conflict';

export type GoogleOAuthAuthorizedUser = {
  id: string;
  email: string;
  emailVerified: Date;
  name: string;
  isAdmin: boolean;
};

type GoogleOAuthResult =
  | { ok: true; user: GoogleOAuthAuthorizedUser }
  | { ok: false; reason: GoogleOAuthDeniedReason };

type GoogleOAuthInput = {
  providerAccountId: string | null;
  email: string | null;
  emailVerified: boolean;
  name?: string | null;
  account: {
    type?: string | null;
    refreshToken?: string | null;
    accessToken?: string | null;
    expiresAt?: number | null;
    tokenType?: string | null;
    scope?: string | null;
    idToken?: string | null;
    sessionState?: string | null;
  };
  now?: Date;
};

const userSelect = {
  id: true,
  email: true,
  emailVerified: true,
  displayName: true,
  role: true,
  deletedAt: true,
} as const;

async function ensureVerified(
  prisma: PrismaClientLike,
  user: StoredUser,
  now: Date,
): Promise<VerifiedStoredUser> {
  if (user.emailVerified) {
    return { ...user, emailVerified: user.emailVerified };
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: now },
    select: userSelect,
  });

  return {
    ...updated,
    emailVerified: updated.emailVerified ?? now,
  };
}

function deriveDisplayName(name: string | null | undefined, email: string): string {
  const trimmed = name?.trim();
  if (trimmed && trimmed.length >= 2) {
    return trimmed;
  }

  const fallback = email.split('@')[0]?.trim() ?? '';
  if (fallback.length >= 2) {
    return fallback;
  }

  return 'Atlas User';
}

function normalizeEmail(email: string | null): string | null {
  const value = email?.trim().toLowerCase();
  if (!value) {
    return null;
  }
  return value;
}

async function createGoogleLink({
  prisma,
  userId,
  providerAccountId,
  account,
}: {
  prisma: PrismaClientLike;
  userId: string;
  providerAccountId: string;
  account: GoogleOAuthInput['account'];
}): Promise<'ok' | 'conflict'> {
  try {
    await prisma.account.create({
      data: {
        userId,
        type: account.type ?? 'oauth',
        provider: 'google',
        providerAccountId,
        refresh_token: account.refreshToken ?? null,
        access_token: account.accessToken ?? null,
        expires_at: account.expiresAt ?? null,
        token_type: account.tokenType ?? null,
        scope: account.scope ?? null,
        id_token: account.idToken ?? null,
        session_state: account.sessionState ?? null,
      },
    });

    return 'ok';
  } catch {
    const existing = await prisma.account.findUnique({
      where: { provider_providerAccountId: { provider: 'google', providerAccountId } },
      select: { userId: true, user: { select: userSelect } },
    });

    if (!existing || existing.userId !== userId) {
      return 'conflict';
    }

    return 'ok';
  }
}

function asAuthorizedUser(user: VerifiedStoredUser): GoogleOAuthAuthorizedUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    name: user.displayName,
    isAdmin: user.role === 'admin',
  };
}

export async function resolveGoogleOAuthSignIn({
  prisma,
  input,
}: {
  prisma: PrismaClientLike;
  input: GoogleOAuthInput;
}): Promise<GoogleOAuthResult> {
  const now = input.now ?? new Date();
  const providerAccountId = input.providerAccountId?.trim() ?? '';

  if (!providerAccountId) {
    return { ok: false, reason: 'missing_provider_account_id' };
  }

  const linkedAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'google',
        providerAccountId,
      },
    },
    select: { userId: true, user: { select: userSelect } },
  });

  if (linkedAccount) {
    if (linkedAccount.user.deletedAt) {
      return { ok: false, reason: 'deleted_user' };
    }

    // Keep the app's email-verification policy authoritative after account changes.
    // If app email is unverified (e.g. email update pending verification), deny OAuth sign-in.
    if (!linkedAccount.user.emailVerified) {
      return { ok: false, reason: 'email_not_verified' };
    }

    return {
      ok: true,
      user: {
        id: linkedAccount.user.id,
        email: linkedAccount.user.email,
        emailVerified: linkedAccount.user.emailVerified,
        name: linkedAccount.user.displayName,
        isAdmin: linkedAccount.user.role === 'admin',
      },
    };
  }

  const normalizedEmail = normalizeEmail(input.email);
  if (!normalizedEmail) {
    return { ok: false, reason: 'missing_email' };
  }

  if (!input.emailVerified) {
    return { ok: false, reason: 'email_not_verified' };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: userSelect,
  });

  if (existingUser) {
    if (existingUser.deletedAt) {
      return { ok: false, reason: 'deleted_user' };
    }

    const verifiedUser = await ensureVerified(prisma, existingUser, now);
    const linkResult = await createGoogleLink({
      prisma,
      userId: verifiedUser.id,
      providerAccountId,
      account: input.account,
    });

    if (linkResult === 'conflict') {
      return { ok: false, reason: 'account_conflict' };
    }

    return { ok: true, user: asAuthorizedUser(verifiedUser) };
  }

  const createdUser = await prisma.user.create({
    data: {
      email: normalizedEmail,
      emailVerified: now,
      passwordHash: await hashPassword(generateToken(32)),
      displayName: deriveDisplayName(input.name, normalizedEmail),
    },
    select: userSelect,
  });

  const linkResult = await createGoogleLink({
    prisma,
    userId: createdUser.id,
    providerAccountId,
    account: input.account,
  });

  if (linkResult === 'conflict') {
    return { ok: false, reason: 'account_conflict' };
  }

  const verifiedCreatedUser = await ensureVerified(prisma, createdUser, now);
  return { ok: true, user: asAuthorizedUser(verifiedCreatedUser) };
}
