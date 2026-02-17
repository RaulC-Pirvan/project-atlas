import { ApiError } from '../api/errors';
import { isAdminPrincipal, shouldEnforceAdminTwoFactor } from '../auth/twoFactorPolicy';
import { prisma as sharedPrisma } from '../db/prisma';

type AdminSession = {
  user?: {
    id?: string | null;
    email?: string | null;
    isAdmin?: boolean | null;
  } | null;
} | null;

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
  };
};

type RequireAdminSessionArgs = {
  prisma?: PrismaLike;
  now?: Date;
};

export async function requireAdminSession(
  session: AdminSession,
  args: RequireAdminSessionArgs = {},
) {
  const userId = session?.user?.id ?? null;
  if (!userId) {
    throw new ApiError('unauthorized', 'Not authenticated.', 401);
  }

  const prisma = args.prisma ?? sharedPrisma;
  const now = args.now ?? new Date();
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
    throw new ApiError('unauthorized', 'Not authenticated.', 401);
  }

  const isAdmin = isAdminPrincipal({
    role: user.role,
    email: user.email,
    sessionIsAdmin: session?.user?.isAdmin ?? false,
  });

  if (!isAdmin) {
    throw new ApiError('unauthorized', 'Admin access is restricted.', 403);
  }

  const enforceAdminTwoFactor = shouldEnforceAdminTwoFactor(now);
  if (enforceAdminTwoFactor && !user.twoFactorEnabled) {
    throw new ApiError('forbidden', 'Admin 2FA enrollment is required.', 403);
  }

  return { userId, email: user.email, twoFactorEnabled: user.twoFactorEnabled };
}
