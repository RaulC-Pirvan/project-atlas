import { generateToken, hashToken, isExpired } from './tokens';

export type StepUpAction =
  | 'account_email_change'
  | 'account_password_change'
  | 'account_delete'
  | 'admin_access';

export type StepUpMethod = 'totp' | 'recovery_code' | 'password';

const DEFAULT_STEP_UP_TTL_SECONDS = 10 * 60;
const STEP_UP_LOCK_AFTER_ATTEMPTS = 5;
const STEP_UP_LOCK_DURATION_MS = 5 * 60 * 1000;

export type StepUpChallengeRecord = {
  id: string;
  userId: string;
  action: StepUpAction;
  challengeTokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  failedAttempts: number;
  lockedUntil: Date | null;
};

type PrismaLike = {
  authStepUpChallenge: {
    create: (args: {
      data: {
        userId: string;
        action: StepUpAction;
        challengeTokenHash: string;
        expiresAt: Date;
      };
      select: { id: true; expiresAt: true };
    }) => Promise<{ id: string; expiresAt: Date }>;
    findUnique: (args: {
      where: { challengeTokenHash: string };
      select: {
        id: true;
        userId: true;
        action: true;
        challengeTokenHash: true;
        expiresAt: true;
        consumedAt: true;
        failedAttempts: true;
        lockedUntil: true;
      };
    }) => Promise<StepUpChallengeRecord | null>;
    update: (args: {
      where: { id: string };
      data: {
        failedAttempts?: number;
        lastAttemptAt?: Date;
        lockedUntil?: Date | null;
        consumedAt?: Date;
        verifiedAt?: Date;
        verifiedMethod?: StepUpMethod;
      };
    }) => Promise<{ id: string }>;
  };
};

export function getStepUpChallengeTtlSeconds() {
  return DEFAULT_STEP_UP_TTL_SECONDS;
}

export function getStepUpLockAfterAttempts() {
  return STEP_UP_LOCK_AFTER_ATTEMPTS;
}

export function getStepUpLockDurationMs() {
  return STEP_UP_LOCK_DURATION_MS;
}

export function isStepUpChallengeLocked(
  record: Pick<StepUpChallengeRecord, 'lockedUntil'>,
  now: Date,
) {
  return !!record.lockedUntil && record.lockedUntil.getTime() > now.getTime();
}

export function isStepUpChallengeConsumable(record: StepUpChallengeRecord, now: Date) {
  if (record.consumedAt) {
    return { ok: false as const, reason: 'consumed' as const };
  }

  if (isExpired(record.expiresAt, now)) {
    return { ok: false as const, reason: 'expired' as const };
  }

  if (isStepUpChallengeLocked(record, now)) {
    return { ok: false as const, reason: 'locked' as const };
  }

  return { ok: true as const };
}

export async function createStepUpChallenge(args: {
  prisma: PrismaLike;
  userId: string;
  action: StepUpAction;
  now?: Date;
  ttlSeconds?: number;
}) {
  const now = args.now ?? new Date();
  const ttlSeconds = args.ttlSeconds ?? DEFAULT_STEP_UP_TTL_SECONDS;
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 30 || ttlSeconds > 60 * 60) {
    throw new Error('Invalid step-up TTL.');
  }

  const challengeToken = generateToken(32);
  const challengeTokenHash = hashToken(challengeToken);
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  const record = await args.prisma.authStepUpChallenge.create({
    data: {
      userId: args.userId,
      action: args.action,
      challengeTokenHash,
      expiresAt,
    },
    select: { id: true, expiresAt: true },
  });

  return {
    challengeId: record.id,
    challengeToken,
    expiresAt: record.expiresAt,
  };
}

export async function getStepUpChallengeByToken(args: {
  prisma: PrismaLike;
  challengeToken: string;
}) {
  const challengeTokenHash = hashToken(args.challengeToken);
  return args.prisma.authStepUpChallenge.findUnique({
    where: { challengeTokenHash },
    select: {
      id: true,
      userId: true,
      action: true,
      challengeTokenHash: true,
      expiresAt: true,
      consumedAt: true,
      failedAttempts: true,
      lockedUntil: true,
    },
  });
}

export async function recordFailedStepUpAttempt(args: {
  prisma: PrismaLike;
  challenge: Pick<StepUpChallengeRecord, 'id' | 'failedAttempts'>;
  now?: Date;
}) {
  const now = args.now ?? new Date();
  const nextAttempts = args.challenge.failedAttempts + 1;
  const shouldLock = nextAttempts >= STEP_UP_LOCK_AFTER_ATTEMPTS;

  await args.prisma.authStepUpChallenge.update({
    where: { id: args.challenge.id },
    data: {
      failedAttempts: nextAttempts,
      lastAttemptAt: now,
      lockedUntil: shouldLock ? new Date(now.getTime() + STEP_UP_LOCK_DURATION_MS) : null,
    },
  });

  return {
    failedAttempts: nextAttempts,
    lockedUntil: shouldLock ? new Date(now.getTime() + STEP_UP_LOCK_DURATION_MS) : null,
  };
}

export async function consumeStepUpChallenge(args: {
  prisma: PrismaLike;
  challengeId: string;
  method: StepUpMethod;
  now?: Date;
}) {
  const now = args.now ?? new Date();

  await args.prisma.authStepUpChallenge.update({
    where: { id: args.challengeId },
    data: {
      consumedAt: now,
      verifiedAt: now,
      verifiedMethod: args.method,
      failedAttempts: 0,
      lockedUntil: null,
      lastAttemptAt: now,
    },
  });
}
