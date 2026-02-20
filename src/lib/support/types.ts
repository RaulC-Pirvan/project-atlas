export const SUPPORT_TICKET_CATEGORIES = ['billing', 'account', 'bug', 'feature_request'] as const;

export type SupportTicketCategory = (typeof SUPPORT_TICKET_CATEGORIES)[number];

export const SUPPORT_TICKET_STATUSES = ['open', 'in_progress', 'resolved'] as const;

export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const SUPPORT_ABUSE_SIGNAL_TYPES = [
  'submission_attempt',
  'honeypot_hit',
  'rate_limited',
  'captcha_required',
  'captcha_failed',
] as const;

export type SupportAbuseSignalType = (typeof SUPPORT_ABUSE_SIGNAL_TYPES)[number];

export type CreateSupportTicketInput = {
  userId?: string | null;
  category: SupportTicketCategory;
  name: string;
  email: string;
  subject: string;
  message: string;
  ipHash: string;
  emailHash?: string | null;
  userAgent?: string | null;
  retentionExpiresAt: Date;
  legalHoldUntil?: Date | null;
};

export type SupportTicketLifecycleRecord = {
  id: string;
  status: SupportTicketStatus;
  inProgressAt: Date | null;
  resolvedAt: Date | null;
  retentionExpiresAt: Date;
  legalHoldUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SupportTicketDto = {
  id: string;
  category: SupportTicketCategory;
  status: SupportTicketStatus;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  inProgressAt: string | null;
  resolvedAt: string | null;
};

export type AdminSupportTicketSummary = {
  id: string;
  category: SupportTicketCategory;
  status: SupportTicketStatus;
  subject: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};
