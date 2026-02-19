import { consumeRecoveryCode } from './recoveryCodes';
import { verifyUserTotpCode } from './twoFactor';

export type TwoFactorVerificationMethod = 'totp' | 'recovery_code';

type PrismaLike = Parameters<typeof verifyUserTotpCode>[0]['prisma'] &
  Parameters<typeof consumeRecoveryCode>[0]['prisma'];

export async function verifyTwoFactorMethod(args: {
  prisma: PrismaLike;
  userId: string;
  method: TwoFactorVerificationMethod;
  code: string;
  now?: Date;
}) {
  const now = args.now ?? new Date();

  if (args.method === 'totp') {
    const result = await verifyUserTotpCode({
      prisma: args.prisma,
      userId: args.userId,
      code: args.code,
      now,
    });

    return { valid: result.valid };
  }

  const consumed = await consumeRecoveryCode({
    prisma: args.prisma,
    userId: args.userId,
    recoveryCode: args.code,
    now,
  });

  return { valid: consumed };
}
