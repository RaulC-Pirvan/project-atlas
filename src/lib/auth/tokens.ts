import crypto from 'node:crypto';

/**
 * Generates a cryptographically strong random token.
 */
export function generateToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash a token for storage (raw token never stored).
 * SHA-256 is correct here because tokens are high-entropy random values.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Returns true if `expiresAt` is in the past (or equal to now).
 */
export function isExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
