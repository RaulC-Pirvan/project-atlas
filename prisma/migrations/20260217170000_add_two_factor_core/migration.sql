-- Sprint 13.2 Phase 1: core 2FA models and step-up challenge state.

ALTER TABLE "User"
ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "StepUpAction" AS ENUM (
  'account_email_change',
  'account_password_change',
  'account_delete',
  'admin_access'
);

CREATE TYPE "StepUpMethod" AS ENUM ('totp', 'recovery_code', 'password');

CREATE TABLE "UserTwoFactor" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "secretEncrypted" TEXT NOT NULL,
  "enabledAt" TIMESTAMP(3),
  "lastVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserTwoFactor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserTwoFactor_userId_key" ON "UserTwoFactor"("userId");
CREATE INDEX "UserTwoFactor_userId_idx" ON "UserTwoFactor"("userId");

ALTER TABLE "UserTwoFactor"
ADD CONSTRAINT "UserTwoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UserRecoveryCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserRecoveryCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserRecoveryCode_userId_codeHash_key" ON "UserRecoveryCode"("userId", "codeHash");
CREATE INDEX "UserRecoveryCode_userId_consumedAt_revokedAt_idx" ON "UserRecoveryCode"("userId", "consumedAt", "revokedAt");

ALTER TABLE "UserRecoveryCode"
ADD CONSTRAINT "UserRecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AuthStepUpChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" "StepUpAction" NOT NULL,
  "challengeTokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "verifiedAt" TIMESTAMP(3),
  "verifiedMethod" "StepUpMethod",
  "failedAttempts" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "lockedUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuthStepUpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthStepUpChallenge_challengeTokenHash_key" ON "AuthStepUpChallenge"("challengeTokenHash");
CREATE INDEX "AuthStepUpChallenge_userId_action_expiresAt_idx" ON "AuthStepUpChallenge"("userId", "action", "expiresAt");
CREATE INDEX "AuthStepUpChallenge_expiresAt_idx" ON "AuthStepUpChallenge"("expiresAt");

ALTER TABLE "AuthStepUpChallenge"
ADD CONSTRAINT "AuthStepUpChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
