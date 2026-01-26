export type LoginCandidate = {
  emailVerified: Date | null;
  deletedAt?: Date | null;
};

/**
 * Returns whether the account is allowed to log in.
 *
 * Policy:
 * - Must have verified email
 * - Must not be soft-deleted
 */
export function canLogin(user: LoginCandidate): boolean {
  if (!user.emailVerified) return false;
  if (user.deletedAt) return false;
  return true;
}
