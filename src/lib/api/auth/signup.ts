import { sendVerificationEmail } from '../../../infra/email/sendVerificationEmail';
import { hashPassword } from '../../auth/password';
import { generateToken, hashToken } from '../../auth/tokens';
import { ApiError } from '../errors';

const VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

type PrismaClientLike = {
  user: {
    findUnique: (args: {
      where: { email: string };
      select: { id: true };
    }) => Promise<{ id: string } | null>;
    create: (args: {
      data: { email: string; passwordHash: string };
      select: { id: true; email: true };
    }) => Promise<{ id: string; email: string }>;
  };
  emailVerificationToken: {
    deleteMany: (args: { where: { userId: string } }) => Promise<{ count: number }>;
    create: (args: {
      data: { userId: string; tokenHash: string; expiresAt: Date };
    }) => Promise<{ id: string }>;
  };
};

type SignupArgs = {
  prisma: PrismaClientLike;
  email: string;
  password: string;
  now?: Date;
  baseUrl?: string;
  generateRawToken?: () => string;
  sendEmail?: (args: { to: string; token: string; baseUrl?: string }) => Promise<void>;
};

export async function signupUser(args: SignupArgs): Promise<{ userId: string }> {
  const now = args.now ?? new Date();
  const email = args.email.toLowerCase();

  const existing = await args.prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    throw new ApiError('email_taken', 'Email already in use.', 409);
  }

  const passwordHash = await hashPassword(args.password);
  const user = await args.prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true },
  });

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
    baseUrl: args.baseUrl,
  });

  return { userId: user.id };
}
