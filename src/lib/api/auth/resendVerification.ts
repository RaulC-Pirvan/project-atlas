import { sendVerificationEmail } from '../../../infra/email/sendVerificationEmail';
import { generateToken, hashToken } from '../../auth/tokens';
import { ApiError } from '../errors';

const VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;
const RESEND_RATE_LIMIT_MS = 1000 * 60 * 5;

type PrismaClientLike = {
  user: {
    findUnique: (args: {
      where: { email: string };
      select: { id: true; email: true; emailVerified: true };
    }) => Promise<{ id: string; email: string; emailVerified: Date | null } | null>;
  };
  emailVerificationToken: {
    findFirst: (args: {
      where: { userId: string };
      orderBy: { createdAt: 'desc' };
      select: { createdAt: true };
    }) => Promise<{ createdAt: Date } | null>;
    deleteMany: (args: { where: { userId: string } }) => Promise<{ count: number }>;
    create: (args: {
      data: { userId: string; tokenHash: string; expiresAt: Date };
    }) => Promise<{ id: string }>;
  };
};

type ResendArgs = {
  prisma: PrismaClientLike;
  email: string;
  now?: Date;
  baseUrl?: string;
  generateRawToken?: () => string;
  sendEmail?: (args: {
    to: string;
    token: string;
    userId?: string;
    baseUrl?: string;
  }) => Promise<void>;
};

export async function resendVerification(args: ResendArgs): Promise<{ status: 'sent' | 'noop' }> {
  const now = args.now ?? new Date();
  const email = args.email.toLowerCase();

  const user = await args.prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, emailVerified: true },
  });

  if (!user || user.emailVerified) {
    return { status: 'noop' };
  }

  const latest = await args.prisma.emailVerificationToken.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  const bypassRateLimit = process.env.ENABLE_TEST_ENDPOINTS === 'true';

  if (
    !bypassRateLimit &&
    latest &&
    now.getTime() - latest.createdAt.getTime() < RESEND_RATE_LIMIT_MS
  ) {
    throw new ApiError('rate_limited', 'Too many requests. Try again later.', 429);
  }

  const rawToken = (args.generateRawToken ?? generateToken)();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(now.getTime() + VERIFICATION_TOKEN_TTL_MS);

  await args.prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  await args.prisma.emailVerificationToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  await (args.sendEmail ?? sendVerificationEmail)({
    to: user.email,
    token: rawToken,
    userId: user.id,
    baseUrl: args.baseUrl,
  });

  return { status: 'sent' };
}
