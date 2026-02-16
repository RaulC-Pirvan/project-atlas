-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordSetAt" TIMESTAMP(3);

-- Backfill existing users as password-set to preserve current credentials behavior.
UPDATE "User"
SET "passwordSetAt" = "createdAt"
WHERE "passwordSetAt" IS NULL;
