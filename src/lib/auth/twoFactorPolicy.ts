import { isAdminEmail } from '../admin/access';

type AdminPrincipalInput = {
  email?: string | null;
  role?: 'user' | 'admin' | null;
  sessionIsAdmin?: boolean | null;
};

export function isAdminPrincipal(input: AdminPrincipalInput): boolean {
  if (input.role === 'admin') {
    return true;
  }

  if (input.sessionIsAdmin) {
    return true;
  }

  return isAdminEmail(input.email ?? null);
}

function parseIsoDate(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function shouldEnforceAdminTwoFactor(now: Date = new Date()): boolean {
  if (process.env.DISABLE_ADMIN_2FA_ENFORCEMENT === 'true') {
    return false;
  }

  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  if (process.env.ENABLE_ADMIN_2FA_ENFORCEMENT === 'true') {
    return true;
  }

  const enforceFrom = parseIsoDate(process.env.ADMIN_2FA_ENFORCE_FROM);
  if (!enforceFrom) {
    return false;
  }

  return now.getTime() >= enforceFrom.getTime();
}
