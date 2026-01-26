import { EmailVerificationError, verifyEmailToken } from '../../auth/emailVerification';
import { ApiError } from '../errors';

type PrismaClientLike = Parameters<typeof verifyEmailToken>[0];

export async function verifyEmail(
  prisma: PrismaClientLike,
  token: string,
  now?: Date,
): Promise<{ userId: string }> {
  try {
    return await verifyEmailToken(prisma, token, now);
  } catch (error) {
    if (error instanceof EmailVerificationError) {
      if (error.message.toLowerCase().includes('expired')) {
        throw new ApiError('token_expired', error.message, 400);
      }
      throw new ApiError('token_invalid', error.message, 400);
    }
    throw error;
  }
}
