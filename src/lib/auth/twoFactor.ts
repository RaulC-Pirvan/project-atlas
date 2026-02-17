import { verifyTotpCode } from './totp';
import { decryptTwoFactorSecret, encryptTwoFactorSecret } from './twoFactorSecret';

type PrismaLike = {
  user: {
    findUnique: (args: {
      where: { id: string };
      select: {
        id: true;
        email: true;
        role: true;
        twoFactorEnabled: true;
      };
    }) => Promise<{
      id: string;
      email: string;
      role: 'user' | 'admin';
      twoFactorEnabled: boolean;
    } | null>;
    update: (args: {
      where: { id: string };
      data: {
        twoFactorEnabled?: boolean;
      };
    }) => Promise<{ id: string }>;
  };
  userTwoFactor: {
    findUnique: (args: {
      where: { userId: string };
      select: {
        id: true;
        userId: true;
        secretEncrypted: true;
        enabledAt: true;
        lastVerifiedAt: true;
      };
    }) => Promise<{
      id: string;
      userId: string;
      secretEncrypted: string;
      enabledAt: Date | null;
      lastVerifiedAt: Date | null;
    } | null>;
    upsert: (args: {
      where: { userId: string };
      create: {
        userId: string;
        secretEncrypted: string;
      };
      update: {
        secretEncrypted: string;
      };
      select: { id: true; userId: true; enabledAt: true };
    }) => Promise<{ id: string; userId: string; enabledAt: Date | null }>;
    update: (args: {
      where: { userId: string };
      data: {
        enabledAt?: Date;
        lastVerifiedAt?: Date;
      };
    }) => Promise<{ id: string }>;
  };
};

export type UserTwoFactorState = {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  twoFactorEnabled: boolean;
  hasTotpSecret: boolean;
};

export async function getUserTwoFactorState(
  prisma: PrismaLike,
  userId: string,
): Promise<UserTwoFactorState | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      twoFactorEnabled: true,
    },
  });
  if (!user) {
    return null;
  }

  const config = await prisma.userTwoFactor.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      secretEncrypted: true,
      enabledAt: true,
      lastVerifiedAt: true,
    },
  });

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
    hasTotpSecret: !!config?.secretEncrypted,
  };
}

export async function setUserTotpSecret(args: {
  prisma: PrismaLike;
  userId: string;
  secret: string;
  encryptionKey?: string;
}) {
  const secretEncrypted = encryptTwoFactorSecret(args.secret, args.encryptionKey);

  return args.prisma.userTwoFactor.upsert({
    where: { userId: args.userId },
    create: {
      userId: args.userId,
      secretEncrypted,
    },
    update: {
      secretEncrypted,
    },
    select: { id: true, userId: true, enabledAt: true },
  });
}

export async function enableUserTwoFactor(args: {
  prisma: PrismaLike;
  userId: string;
  now?: Date;
}) {
  const now = args.now ?? new Date();
  await args.prisma.userTwoFactor.update({
    where: { userId: args.userId },
    data: {
      enabledAt: now,
      lastVerifiedAt: now,
    },
  });
  await args.prisma.user.update({
    where: { id: args.userId },
    data: {
      twoFactorEnabled: true,
    },
  });
}

export async function disableUserTwoFactor(args: { prisma: PrismaLike; userId: string }) {
  await args.prisma.user.update({
    where: { id: args.userId },
    data: {
      twoFactorEnabled: false,
    },
  });
}

export async function verifyUserTotpCode(args: {
  prisma: PrismaLike;
  userId: string;
  code: string;
  now?: Date;
  skewSteps?: number;
  encryptionKey?: string;
}) {
  const now = args.now ?? new Date();
  const config = await args.prisma.userTwoFactor.findUnique({
    where: { userId: args.userId },
    select: {
      id: true,
      userId: true,
      secretEncrypted: true,
      enabledAt: true,
      lastVerifiedAt: true,
    },
  });

  if (!config) {
    return { valid: false };
  }

  const decryptedSecret = decryptTwoFactorSecret(config.secretEncrypted, args.encryptionKey);
  const verification = verifyTotpCode(decryptedSecret, args.code, {
    timestampMs: now.getTime(),
    skewSteps: args.skewSteps,
  });

  if (!verification.valid) {
    return { valid: false };
  }

  await args.prisma.userTwoFactor.update({
    where: { userId: args.userId },
    data: {
      lastVerifiedAt: now,
    },
  });

  return { valid: true, stepOffset: verification.stepOffset };
}
