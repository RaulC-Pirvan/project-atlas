import { ApiError } from '../api/errors';
import { isAdminEmail } from './access';

type AdminSession = {
  user?: {
    id?: string | null;
    email?: string | null;
    isAdmin?: boolean | null;
  } | null;
} | null;

function hasAdminAccess(session: AdminSession): boolean {
  const isAdmin = session?.user?.isAdmin ?? false;
  if (isAdmin) return true;

  const email = session?.user?.email ?? null;
  return isAdminEmail(email);
}

export function requireAdminSession(session: AdminSession) {
  const userId = session?.user?.id ?? null;
  if (!userId) {
    throw new ApiError('unauthorized', 'Not authenticated.', 401);
  }

  if (!hasAdminAccess(session)) {
    throw new ApiError('unauthorized', 'Admin access is restricted.', 403);
  }

  const email = session?.user?.email ?? null;
  return { userId, email };
}
