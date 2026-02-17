import { ApiError } from '../api/errors';
import type { StepUpAction } from './stepUpChallenges';
import { getStepUpChallengeByToken } from './stepUpChallenges';

const STEP_UP_PROOF_MAX_AGE_MS = 10 * 60 * 1000;

type PrismaLike = Parameters<typeof getStepUpChallengeByToken>[0]['prisma'] & {
  authStepUpChallenge: {
    delete: (args: { where: { id: string } }) => Promise<{ id: string }>;
  };
};

type RequireFreshStepUpProofArgs = {
  prisma: PrismaLike;
  userId: string;
  action: StepUpAction;
  stepUpChallengeToken?: string | null;
  maxAgeMs?: number;
  now?: Date;
};

export async function requireFreshStepUpProof({
  prisma,
  userId,
  action,
  stepUpChallengeToken,
  maxAgeMs = STEP_UP_PROOF_MAX_AGE_MS,
  now = new Date(),
}: RequireFreshStepUpProofArgs) {
  if (!stepUpChallengeToken) {
    throw new ApiError('unauthorized', 'Step-up verification required.', 401);
  }

  const challenge = await getStepUpChallengeByToken({
    prisma,
    challengeToken: stepUpChallengeToken,
  });

  if (!challenge || challenge.userId !== userId || challenge.action !== action) {
    throw new ApiError('unauthorized', 'Invalid step-up verification.', 401);
  }

  if (challenge.expiresAt.getTime() <= now.getTime()) {
    throw new ApiError('token_expired', 'Step-up verification expired.', 401);
  }

  if (!challenge.consumedAt || !challenge.verifiedAt) {
    throw new ApiError('unauthorized', 'Step-up verification required.', 401);
  }

  if (challenge.lockedUntil && challenge.lockedUntil.getTime() > now.getTime()) {
    throw new ApiError('rate_limited', 'Too many verification attempts. Try again later.', 429);
  }

  if (now.getTime() - challenge.verifiedAt.getTime() > maxAgeMs) {
    throw new ApiError('token_expired', 'Step-up verification expired.', 401);
  }

  return challenge;
}

export async function consumeStepUpProof(args: {
  prisma: PrismaLike;
  challengeId: string;
}) {
  await args.prisma.authStepUpChallenge.delete({
    where: { id: args.challengeId },
  });
}
