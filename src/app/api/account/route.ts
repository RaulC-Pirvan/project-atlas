import { getServerSession } from 'next-auth/next';

import { sendVerificationEmail } from '../../../infra/email/sendVerificationEmail';
import { updateAccountSchema } from '../../../lib/api/auth/validation';
import { ApiError, asApiError } from '../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../lib/api/response';
import { authOptions } from '../../../lib/auth/nextauth';
import { hashPassword } from '../../../lib/auth/password';
import { consumeStepUpProof, requireFreshStepUpProof } from '../../../lib/auth/stepUpProof';
import { generateToken, hashToken } from '../../../lib/auth/tokens';
import { prisma } from '../../../lib/db/prisma';
import { withApiLogging } from '../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

const VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

export async function PUT(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/account' },
    async () => {
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
        select: {
          id: true,
          email: true,
          passwordHash: true,
          passwordSetAt: true,
          displayName: true,
          weekStart: true,
          keepCompletedAtBottom: true,
        },
      });
      if (!user) {
        throw new ApiError('not_found', 'User not found.', 404);
      }

      const updates: {
        email?: string;
        passwordHash?: string;
        passwordSetAt?: Date | null;
        emailVerified?: Date | null;
        displayName?: string;
        weekStart?: 'sun' | 'mon';
        keepCompletedAtBottom?: boolean;
      } = {};
      let stepUpChallengeIdToConsume: string | null = null;

      const normalizedIncomingEmail = parsed.data.email?.toLowerCase();
      const emailWillChange = !!normalizedIncomingEmail && normalizedIncomingEmail !== user.email;
      const passwordWillChange = !!parsed.data.password;

      if (emailWillChange && passwordWillChange) {
        throw new ApiError(
          'invalid_request',
          'Update email and password separately so each change can be verified.',
          400,
        );
      }

      if (emailWillChange) {
        if (!normalizedIncomingEmail) {
          throw new ApiError('invalid_request', 'Email is required.', 400);
        }

        const proof = await requireFreshStepUpProof({
          prisma,
          userId: user.id,
          action: 'account_email_change',
          stepUpChallengeToken: parsed.data.stepUpChallengeToken,
        });
        stepUpChallengeIdToConsume = proof.id;

        const existing = await prisma.user.findUnique({
          where: { email: normalizedIncomingEmail },
          select: { id: true },
        });
        if (existing && existing.id !== user.id) {
          throw new ApiError('email_taken', 'Email already in use.', 409);
        }

        updates.email = normalizedIncomingEmail;
        updates.emailVerified = null;
      }

      if (passwordWillChange) {
        if (!parsed.data.password) {
          throw new ApiError('invalid_request', 'Password is required.', 400);
        }

        const proof = await requireFreshStepUpProof({
          prisma,
          userId: user.id,
          action: 'account_password_change',
          stepUpChallengeToken: parsed.data.stepUpChallengeToken,
        });
        stepUpChallengeIdToConsume = proof.id;

        updates.passwordHash = await hashPassword(parsed.data.password);
        updates.passwordSetAt = new Date();
      }

      if (parsed.data.displayName !== undefined) {
        const normalizedDisplayName = parsed.data.displayName.trim();
        if (!normalizedDisplayName) {
          throw new ApiError('invalid_request', 'Display name is required.', 400);
        }
        updates.displayName = normalizedDisplayName;
      }

      if (parsed.data.weekStart && parsed.data.weekStart !== user.weekStart) {
        updates.weekStart = parsed.data.weekStart;
      }

      if (
        parsed.data.keepCompletedAtBottom !== undefined &&
        parsed.data.keepCompletedAtBottom !== user.keepCompletedAtBottom
      ) {
        updates.keepCompletedAtBottom = parsed.data.keepCompletedAtBottom;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
      if (stepUpChallengeIdToConsume) {
        await consumeStepUpProof({
          prisma,
          challengeId: stepUpChallengeIdToConsume,
        });
      }

      if (updates.email) {
        const rawToken = generateToken();
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

        await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
        await prisma.emailVerificationToken.create({
          data: { userId: user.id, tokenHash, expiresAt },
        });

        await sendVerificationEmail({ to: updates.email, token: rawToken, userId: user.id });
      }

      return jsonOk({ ok: true });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
