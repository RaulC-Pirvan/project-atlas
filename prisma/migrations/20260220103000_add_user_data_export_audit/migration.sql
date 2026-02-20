-- Sprint 14.3 Phase 0: self-service export audit model.

CREATE TYPE "UserDataExportAuditStatus" AS ENUM ('success', 'failure');
CREATE TYPE "UserDataExportFormat" AS ENUM ('json');

CREATE TABLE "UserDataExportAudit" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "UserDataExportAuditStatus" NOT NULL,
  "format" "UserDataExportFormat" NOT NULL DEFAULT 'json',
  "recordCounts" JSONB,
  "requestId" TEXT NOT NULL,
  "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserDataExportAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserDataExportAudit_userId_requestedAt_idx"
ON "UserDataExportAudit"("userId", "requestedAt");

CREATE INDEX "UserDataExportAudit_requestedAt_idx"
ON "UserDataExportAudit"("requestedAt");

CREATE INDEX "UserDataExportAudit_requestId_idx"
ON "UserDataExportAudit"("requestId");
