import bcrypt from 'bcryptjs';

const BCRYPT_COST = 12;

/**
 * Hashes a plaintext password using bcrypt.
 * This is intentionally slow (cost factor) to resist brute-force attacks.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
