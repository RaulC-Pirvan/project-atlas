-- Sprint 14.1 Phase 0: support ticket persistence, status model, and abuse signals.

CREATE TYPE "SupportTicketCategory" AS ENUM ('billing', 'account', 'bug', 'feature_request');
CREATE TYPE "SupportTicketStatus" AS ENUM ('open', 'in_progress', 'resolved');
CREATE TYPE "SupportAbuseSignalType" AS ENUM (
  'submission_attempt',
  'honeypot_hit',
  'rate_limited',
  'captcha_required',
  'captcha_failed'
);

CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "category" "SupportTicketCategory" NOT NULL,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'open',
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailHash" TEXT,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "ipHash" TEXT NOT NULL,
  "userAgent" TEXT,
  "inProgressAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "retentionExpiresAt" TIMESTAMP(3) NOT NULL,
  "legalHoldUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");
CREATE INDEX "SupportTicket_retentionExpiresAt_idx" ON "SupportTicket"("retentionExpiresAt");
CREATE INDEX "SupportTicket_legalHoldUntil_idx" ON "SupportTicket"("legalHoldUntil");
CREATE INDEX "SupportTicket_ipHash_createdAt_idx" ON "SupportTicket"("ipHash", "createdAt");
CREATE INDEX "SupportTicket_emailHash_createdAt_idx" ON "SupportTicket"("emailHash", "createdAt");

ALTER TABLE "SupportTicket"
ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SupportAbuseSignal" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT,
  "signalType" "SupportAbuseSignalType" NOT NULL,
  "ipHash" TEXT NOT NULL,
  "emailHash" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SupportAbuseSignal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportAbuseSignal_ticketId_idx" ON "SupportAbuseSignal"("ticketId");
CREATE INDEX "SupportAbuseSignal_signalType_createdAt_idx" ON "SupportAbuseSignal"("signalType", "createdAt");
CREATE INDEX "SupportAbuseSignal_ipHash_createdAt_idx" ON "SupportAbuseSignal"("ipHash", "createdAt");
CREATE INDEX "SupportAbuseSignal_emailHash_createdAt_idx" ON "SupportAbuseSignal"("emailHash", "createdAt");

ALTER TABLE "SupportAbuseSignal"
ADD CONSTRAINT "SupportAbuseSignal_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
