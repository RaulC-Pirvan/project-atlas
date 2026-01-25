import { signInSchema } from '../api/auth/validation';
import { clearLoginAttempts, isLoginRateLimited, recordFailedLogin } from './loginRateLimit';
import { verifyPassword } from './password';

type PrismaClientLike = {
  user: {
    findUnique: (args: {
      where: { email: string };
      select: {
        id: true;
        email: true;
        passwordHash: true;
        emailVerified: true;
        deletedAt: true;
        displayName: true;
      };
    }) => Promise<{
      id: string;
      email: string;
      passwordHash: string;
      emailVerified: Date | null;
      deletedAt: Date | null;
      displayName: string | null;
    } | null>;
  };
};

export type AuthorizedUser = {
  id: string;
  email: string;
  emailVerified: Date | null;
  name?: string | null;
};

type AuthorizeArgs = {
  prisma: PrismaClientLike;
  credentials: unknown;
  rateLimitKey: string;
  now?: Date;
};

export async function authorizeCredentials({
  prisma,
  credentials,
  rateLimitKey,
  now,
}: AuthorizeArgs): Promise<AuthorizedUser | null> {
  const timestamp = (now ?? new Date()).getTime();
  const key = rateLimitKey || 'unknown';

  if (isLoginRateLimited(key, timestamp)) return null;

  const parsed = signInSchema.safeParse(credentials);
  if (!parsed.success) {
    recordFailedLogin(key, timestamp);
    return null;
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      emailVerified: true,
      deletedAt: true,
      displayName: true,
    },
  });

  if (!user) {
    recordFailedLogin(key, timestamp);
    return null;
  }

  const passwordOk = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!passwordOk) {
    recordFailedLogin(key, timestamp);
    return null;
  }

  if (user.deletedAt) {
    recordFailedLogin(key, timestamp);
    return null;
  }

  if (!user.emailVerified) {
    throw new Error('EMAIL_NOT_VERIFIED');
  }

  clearLoginAttempts(key);
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    name: user.displayName,
  };
}
