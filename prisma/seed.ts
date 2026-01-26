import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/db/prisma';

/**
 * Seed script for Project Atlas.
 *
 * Purpose:
 * - Create predictable development users
 * - One verified account
 * - One unverified account
 *
 * This enables:
 * - Manual login testing
 * - Email verification flow testing
 * - Guard checks for unverified users
 *
 * IMPORTANT:
 * - This script is intended for local/dev environments only
 * - Do NOT rely on these users in production
 */
async function main() {
  /**
   * Password used for seeded users.
   *
   * - Pulled from SEED_PASSWORD env var when available
   * - Falls back to a known value to avoid breaking CI
   *
   * SECURITY:
   * - Password is hashed with bcrypt before storage
   * - .env is not committed to version control
   */
  const password = process.env.SEED_PASSWORD ?? 'ChangeMe123!';

  /**
   * Hash the password using bcrypt.
   *
   * Cost factor:
   * - 12 rounds is a good default
   * - Slow enough to resist brute force
   * - Fast enough for development and CI
   */
  const verifiedHash = await bcrypt.hash(password, 12);
  const unverifiedHash = await bcrypt.hash(password, 12);

  /**
   * Seed a verified user.
   *
   * - emailVerified is set to current date
   * - upsert makes the script idempotent:
   *   running it multiple times will not create duplicates
   */
  await prisma.user.upsert({
    where: { email: 'verified@example.com' },
    update: {},
    create: {
      email: 'verified@example.com',
      passwordHash: verifiedHash,
      emailVerified: new Date(),
      displayName: 'Verified User',
    },
  });

  /**
   * Seed an unverified user.
   *
   * - emailVerified remains null
   * - Useful for testing:
   *   - blocked login
   *   - resend verification email
   */
  await prisma.user.upsert({
    where: { email: 'unverified@example.com' },
    update: {},
    create: {
      email: 'unverified@example.com',
      passwordHash: unverifiedHash,
      emailVerified: null,
      displayName: 'Unverified User',
    },
  });
}

/**
 * Execute seed script.
 *
 * - Ensures Prisma disconnects cleanly
 * - Logs and exits with failure code on error
 * - Required for CI and scripting hygiene
 */
main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
