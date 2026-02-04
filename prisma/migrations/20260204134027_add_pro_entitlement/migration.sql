-- CreateEnum
CREATE TYPE "ProEntitlementStatus" AS ENUM ('active', 'revoked');

-- CreateEnum
CREATE TYPE "ProEntitlementSource" AS ENUM ('manual', 'app_store', 'play_store', 'promo');

-- CreateTable
CREATE TABLE "ProEntitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ProEntitlementStatus" NOT NULL DEFAULT 'active',
    "source" "ProEntitlementSource" NOT NULL DEFAULT 'manual',
    "externalId" TEXT,
    "restoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProEntitlement_userId_key" ON "ProEntitlement"("userId");

-- CreateIndex
CREATE INDEX "ProEntitlement_status_idx" ON "ProEntitlement"("status");

-- AddForeignKey
ALTER TABLE "ProEntitlement" ADD CONSTRAINT "ProEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
