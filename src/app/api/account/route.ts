import { getServerSession } from 'next-auth/next';

import { sendVerificationEmail } from '../../../infra/email/sendVerificationEmail';
import { updateAccountSchema } from '../../../lib/api/auth/validation';
import { ApiError, asApiError } from '../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../lib/api/response';
import { authOptions } from '../../../lib/auth/nextauth';
import { hashPassword, verifyPassword } from '../../../lib/auth/password';
import { generateToken, hashToken } from '../../../lib/auth/tokens';
import { prisma } from '../../../lib/db/prisma';

export const runtime = 'nodejs';

const VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new ApiError('unauthorized', 'Not authenticated.', 401);
    }

    const body = await request.json();
    const parsed = updateAccountSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('invalid_request', 'Invalid request.', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, passwordHash: true, displayName: true },
    });
    if (!user) {
      throw new ApiError('not_found', 'User not found.', 404);
    }

    const updates: {
      email?: string;
      passwordHash?: string;
      emailVerified?: Date | null;
      displayName?: string;
    } = {};

    if (parsed.data.email && parsed.data.email !== user.email) {
      if (!parsed.data.currentPassword) {
        throw new ApiError(
          'invalid_request',
          'Password confirmation required to change email.',
          400,
        );
      }

      const passwordOk = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
      if (!passwordOk) {
        throw new ApiError('invalid_request', 'Password confirmation does not match.', 400);
      }

      const existing = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
        select: { id: true },
      });
      if (existing && existing.id !== user.id) {
        throw new ApiError('email_taken', 'Email already in use.', 409);
      }

      updates.email = parsed.data.email.toLowerCase();
      updates.emailVerified = null;
    }

    if (parsed.data.password) {
      updates.passwordHash = await hashPassword(parsed.data.password);
    }

    if (parsed.data.displayName !== undefined) {
      const normalizedDisplayName = parsed.data.displayName.trim();
      if (!normalizedDisplayName) {
        throw new ApiError('invalid_request', 'Display name is required.', 400);
      }
      updates.displayName = normalizedDisplayName;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updates,
    });

    if (updates.email) {
      const rawToken = generateToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

      await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
      await prisma.emailVerificationToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      await sendVerificationEmail({ to: updates.email, token: rawToken });
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(asApiError(error));
  }
}
