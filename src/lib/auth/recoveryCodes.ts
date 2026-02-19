import crypto from 'node:crypto';

import { hashToken } from './tokens';

const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_BYTES = 10;
const RECOVERY_CODE_NORMALIZED_LENGTH = RECOVERY_CODE_BYTES * 2;
const RECOVERY_CODE_GROUP_SIZE = 4;

type PrismaLike = {
  userRecoveryCode: {
    updateMany: (args: {
      where:
        | {
            userId: string;
            consumedAt: null;
            revokedAt: null;
          }
        | {
            userId: string;
            codeHash: string;
            consumedAt: null;
            revokedAt: null;
          };
      data: { revokedAt?: Date; consumedAt?: Date };
    }) => Promise<{ count: number }>;
    createMany: (args: {
      data: Array<{ userId: string; codeHash: string; createdAt?: Date }>;
    }) => Promise<{ count: number }>;
  };
};

function formatRecoveryCode(normalized: string): string {
  const groups = [];
  for (let index = 0; index < normalized.length; index += RECOVERY_CODE_GROUP_SIZE) {
    groups.push(normalized.slice(index, index + RECOVERY_CODE_GROUP_SIZE));
  }

  return groups.join('-');
}

function generateSingleRecoveryCode(): string {
  const normalized = crypto.randomBytes(RECOVERY_CODE_BYTES).toString('hex').toUpperCase();
  return formatRecoveryCode(normalized);
}

export function normalizeRecoveryCode(input: string): string {
  return input
    .trim()
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();
}

export function hashRecoveryCode(input: string): string {
  const normalized = normalizeRecoveryCode(input);
  if (normalized.length !== RECOVERY_CODE_NORMALIZED_LENGTH) {
    throw new Error('Invalid recovery code format.');
  }

  return hashToken(normalized);
}

export function generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT): string[] {
  if (!Number.isInteger(count) || count < 1 || count > 50) {
    throw new Error('Invalid recovery code count.');
  }

  const generated = new Set<string>();
  while (generated.size < count) {
    generated.add(generateSingleRecoveryCode());
  }

  return Array.from(generated.values());
}

export function buildRecoveryCodeHashes(codes: string[]): string[] {
  return codes.map((code) => hashRecoveryCode(code));
}

export async function consumeRecoveryCode(args: {
  prisma: PrismaLike;
  userId: string;
  recoveryCode: string;
  now?: Date;
}): Promise<boolean> {
  const now = args.now ?? new Date();
  const codeHash = hashRecoveryCode(args.recoveryCode);

  const result = await args.prisma.userRecoveryCode.updateMany({
    where: {
      userId: args.userId,
      codeHash,
      consumedAt: null,
      revokedAt: null,
    },
    data: { consumedAt: now },
  });

  return result.count > 0;
}

export async function revokeRecoveryCodes(args: {
  prisma: PrismaLike;
  userId: string;
  now?: Date;
}): Promise<{ revokedCount: number }> {
  const now = args.now ?? new Date();

  const result = await args.prisma.userRecoveryCode.updateMany({
    where: {
      userId: args.userId,
      consumedAt: null,
      revokedAt: null,
    },
    data: { revokedAt: now },
  });

  return { revokedCount: result.count };
}

export async function rotateRecoveryCodes(args: {
  prisma: PrismaLike;
  userId: string;
  count?: number;
  now?: Date;
}): Promise<{ codes: string[]; createdCount: number; revokedCount: number }> {
  const now = args.now ?? new Date();
  const codes = generateRecoveryCodes(args.count);
  const hashes = buildRecoveryCodeHashes(codes);

  const revoked = await revokeRecoveryCodes({
    prisma: args.prisma,
    userId: args.userId,
    now,
  });

  const created = await args.prisma.userRecoveryCode.createMany({
    data: hashes.map((codeHash) => ({
      userId: args.userId,
      codeHash,
      createdAt: now,
    })),
  });

  return {
    codes,
    createdCount: created.count,
    revokedCount: revoked.revokedCount,
  };
}
