-- AlterTable
ALTER TABLE "AuthStepUpChallenge" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserTwoFactor" ALTER COLUMN "updatedAt" DROP DEFAULT;
