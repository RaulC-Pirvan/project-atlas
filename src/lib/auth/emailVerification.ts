import { hashToken, isExpired } from './tokens';

/**
 * Custom error for email verification failures.
 * Allows callers to distinguish domain errors from infra errors.
 */
export class EmailVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailVerificationError';
  }
}

type FindVerificationTokenArgs = {
  where: { tokenHash: string };
  select: {
    id: true;
    userId: true;
    tokenHash: true;
    expiresAt: true;
  };
};

type DeleteManyByUserArgs = {
  where: { userId: string };
};

type UpdateUserEmailVerifiedArgs = {
  where: { id: string };
  data: { emailVerified: Date };
};

/**
 * PrismaLike represents the minimal subset of Prisma Client
 * required by this domain service.
 *
 * This allows:
 * - Pure unit testing (mocked Prisma)
 * - No dependency on real DB
 * - No tight coupling to Prisma types
 */
export type PrismaLike = {
  emailVerificationToken: {
    findUnique: (args: FindVerificationTokenArgs) => Promise<{
      id: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    } | null>;

    deleteMany: (args: DeleteManyByUserArgs) => Promise<{ count: number }>;
  };

  user: {
    update: (args: UpdateUserEmailVerifiedArgs) => Promise<{ id: string }>;
  };
};

/**
 * Verify an email verification token:
 * - Hash incoming token
 * - Look up DB record by tokenHash
 * - Reject if missing/expired
 * - Update user.emailVerified
 * - Delete all verification tokens for that user (one-time use)
 */
export async function verifyEmailToken(
  prisma: PrismaLike,
  rawToken: string,
  now: Date = new Date(),
): Promise<{ userId: string }> {
  const tokenHash = hashToken(rawToken);

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, tokenHash: true, expiresAt: true },
  });

  if (!record) throw new EmailVerificationError('Invalid verification token.');
  if (isExpired(record.expiresAt, now))
    throw new EmailVerificationError('Verification token expired.');

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: now },
  });

  await prisma.emailVerificationToken.deleteMany({
    where: { userId: record.userId },
  });

  return { userId: record.userId };
}
