const SUPPORT_RETENTION_MONTHS = 18;

export type SupportRetentionRecord = {
  retentionExpiresAt: Date;
  legalHoldUntil: Date | null;
};

function addMonthsUtc(value: Date, months: number): Date {
  const next = new Date(value);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

export function getSupportRetentionMonths() {
  return SUPPORT_RETENTION_MONTHS;
}

export function computeSupportRetentionExpiresAt(createdAt: Date = new Date()): Date {
  return addMonthsUtc(createdAt, SUPPORT_RETENTION_MONTHS);
}

export function getSupportRetentionCutoff(now: Date = new Date()): Date {
  return addMonthsUtc(now, -SUPPORT_RETENTION_MONTHS);
}

export function isSupportTicketUnderLegalHold(
  ticket: Pick<SupportRetentionRecord, 'legalHoldUntil'>,
  now: Date = new Date(),
): boolean {
  return !!ticket.legalHoldUntil && ticket.legalHoldUntil.getTime() > now.getTime();
}

export function isSupportTicketRetentionExpired(
  ticket: Pick<SupportRetentionRecord, 'retentionExpiresAt'>,
  now: Date = new Date(),
): boolean {
  return ticket.retentionExpiresAt.getTime() <= now.getTime();
}

export function isSupportTicketEligibleForDeletion(
  ticket: SupportRetentionRecord,
  now: Date = new Date(),
): boolean {
  return (
    isSupportTicketRetentionExpired(ticket, now) && !isSupportTicketUnderLegalHold(ticket, now)
  );
}
