import type { SupportTicketStatus } from './types';

const ALLOWED_STATUS_TRANSITIONS: Record<SupportTicketStatus, SupportTicketStatus[]> = {
  open: ['open', 'in_progress', 'resolved'],
  in_progress: ['open', 'in_progress', 'resolved'],
  resolved: ['resolved', 'in_progress'],
};

export type SupportTicketStatusTimestamps = {
  inProgressAt: Date | null;
  resolvedAt: Date | null;
};

export function canTransitionSupportTicketStatus(
  currentStatus: SupportTicketStatus,
  nextStatus: SupportTicketStatus,
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function applySupportTicketStatusTransition(args: {
  currentStatus: SupportTicketStatus;
  nextStatus: SupportTicketStatus;
  currentTimestamps: SupportTicketStatusTimestamps;
  changedAt?: Date;
}): SupportTicketStatusTimestamps {
  if (!canTransitionSupportTicketStatus(args.currentStatus, args.nextStatus)) {
    throw new Error(
      `Invalid support ticket status transition: ${args.currentStatus} -> ${args.nextStatus}.`,
    );
  }

  const changedAt = args.changedAt ?? new Date();

  if (args.nextStatus === 'open') {
    return { inProgressAt: null, resolvedAt: null };
  }

  if (args.nextStatus === 'in_progress') {
    return { inProgressAt: changedAt, resolvedAt: null };
  }

  return {
    inProgressAt: args.currentTimestamps.inProgressAt ?? changedAt,
    resolvedAt: changedAt,
  };
}
