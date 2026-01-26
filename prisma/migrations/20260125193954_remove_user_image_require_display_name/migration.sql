/*
  Warnings:

  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - Made the column `displayName` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
UPDATE "User"
SET "displayName" = 'User'
WHERE "displayName" IS NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "image",
ALTER COLUMN "displayName" SET NOT NULL;
