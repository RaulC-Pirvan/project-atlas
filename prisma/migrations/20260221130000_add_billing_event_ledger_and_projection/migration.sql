-- Sprint 15.1 Phase 1: billing ledger + entitlement projection foundation.

CREATE TYPE "BillingProvider" AS ENUM ('manual', 'stripe', 'ios_iap', 'android_iap');
CREATE TYPE "BillingPlanType" AS ENUM ('one_time', 'subscription');
CREATE TYPE "BillingEntitlementStatus" AS ENUM ('none', 'active', 'revoked');
CREATE TYPE "BillingEventType" AS ENUM (
  'purchase_initiated',
  'purchase_succeeded',
  'purchase_failed',
  'refund_issued',
  'chargeback_opened',
  'chargeback_won',
  'chargeback_lost',
  'entitlement_granted',
  'entitlement_revoked',
  'restore_requested',
  'restore_succeeded',
  'restore_failed'
);

CREATE TABLE "BillingProductMapping" (
  "id" TEXT NOT NULL,
  "provider" "BillingProvider" NOT NULL,
  "providerProductId" TEXT NOT NULL,
  "productKey" TEXT NOT NULL,
  "planType" "BillingPlanType" NOT NULL DEFAULT 'one_time',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BillingProductMapping_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingEventLedger" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" "BillingProvider" NOT NULL,
  "providerEventId" TEXT,
  "providerTransactionId" TEXT,
  "idempotencyKey" TEXT,
  "productKey" TEXT NOT NULL,
  "planType" "BillingPlanType" NOT NULL DEFAULT 'one_time',
  "eventType" "BillingEventType" NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "payload" JSONB NOT NULL,
  "payloadHash" TEXT,
  "signatureVerified" BOOLEAN,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BillingEventLedger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingEntitlementProjection" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productKey" TEXT NOT NULL,
  "planType" "BillingPlanType" NOT NULL DEFAULT 'one_time',
  "status" "BillingEntitlementStatus" NOT NULL DEFAULT 'none',
  "provider" "BillingProvider",
  "providerCustomerId" TEXT,
  "providerAccountId" TEXT,
  "activeFrom" TIMESTAMP(3),
  "activeUntil" TIMESTAMP(3),
  "periodStart" TIMESTAMP(3),
  "periodEnd" TIMESTAMP(3),
  "autoRenew" BOOLEAN,
  "lastEventId" TEXT,
  "lastEventType" "BillingEventType",
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BillingEntitlementProjection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingProductMapping_provider_providerProductId_key"
ON "BillingProductMapping"("provider", "providerProductId");

CREATE INDEX "BillingProductMapping_productKey_active_idx"
ON "BillingProductMapping"("productKey", "active");

CREATE UNIQUE INDEX "BillingEventLedger_eventId_key"
ON "BillingEventLedger"("eventId");

CREATE UNIQUE INDEX "BillingEventLedger_idempotencyKey_key"
ON "BillingEventLedger"("idempotencyKey");

CREATE UNIQUE INDEX "BillingEventLedger_provider_providerEventId_key"
ON "BillingEventLedger"("provider", "providerEventId");

CREATE INDEX "BillingEventLedger_userId_occurredAt_idx"
ON "BillingEventLedger"("userId", "occurredAt");

CREATE INDEX "BillingEventLedger_eventType_occurredAt_idx"
ON "BillingEventLedger"("eventType", "occurredAt");

CREATE INDEX "BillingEventLedger_productKey_idx"
ON "BillingEventLedger"("productKey");

CREATE UNIQUE INDEX "BillingEntitlementProjection_userId_productKey_key"
ON "BillingEntitlementProjection"("userId", "productKey");

CREATE INDEX "BillingEntitlementProjection_status_updatedAt_idx"
ON "BillingEntitlementProjection"("status", "updatedAt");

CREATE INDEX "BillingEntitlementProjection_productKey_updatedAt_idx"
ON "BillingEntitlementProjection"("productKey", "updatedAt");

ALTER TABLE "BillingEventLedger"
ADD CONSTRAINT "BillingEventLedger_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BillingEntitlementProjection"
ADD CONSTRAINT "BillingEntitlementProjection_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION prevent_billing_event_ledger_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'BillingEventLedger is append-only and cannot be mutated';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER billing_event_ledger_no_update
BEFORE UPDATE ON "BillingEventLedger"
FOR EACH ROW
EXECUTE FUNCTION prevent_billing_event_ledger_mutation();

CREATE TRIGGER billing_event_ledger_no_delete
BEFORE DELETE ON "BillingEventLedger"
FOR EACH ROW
EXECUTE FUNCTION prevent_billing_event_ledger_mutation();

INSERT INTO "BillingProductMapping" (
  "id",
  "provider",
  "providerProductId",
  "productKey",
  "planType",
  "active",
  "createdAt",
  "updatedAt"
)
VALUES (
  'cma_manual_mapping_pro_lifetime_v1',
  'manual',
  'pro_lifetime_v1',
  'pro_lifetime_v1',
  'one_time',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("provider", "providerProductId") DO NOTHING;

INSERT INTO "BillingEntitlementProjection" (
  "id",
  "userId",
  "productKey",
  "planType",
  "status",
  "provider",
  "activeFrom",
  "activeUntil",
  "createdAt",
  "updatedAt"
)
SELECT
  CONCAT('cma_proj_', "pe"."id") AS "id",
  "pe"."userId",
  'pro_lifetime_v1' AS "productKey",
  'one_time'::"BillingPlanType" AS "planType",
  CASE
    WHEN "pe"."status" = 'active' THEN 'active'::"BillingEntitlementStatus"
    ELSE 'revoked'::"BillingEntitlementStatus"
  END AS "status",
  CASE
    WHEN "pe"."source" = 'manual' THEN 'manual'::"BillingProvider"
    WHEN "pe"."source" = 'app_store' THEN 'ios_iap'::"BillingProvider"
    WHEN "pe"."source" = 'play_store' THEN 'android_iap'::"BillingProvider"
    ELSE 'manual'::"BillingProvider"
  END AS "provider",
  "pe"."createdAt" AS "activeFrom",
  CASE
    WHEN "pe"."status" = 'revoked' THEN "pe"."updatedAt"
    ELSE NULL
  END AS "activeUntil",
  "pe"."createdAt",
  "pe"."updatedAt"
FROM "ProEntitlement" "pe"
ON CONFLICT ("userId", "productKey") DO NOTHING;
