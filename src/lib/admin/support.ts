import { ApiError } from '../api/errors';
import { applySupportTicketStatusTransition } from '../support/lifecycle';
import type { SupportTicketStatus } from '../support/types';

type SupportTicketRecord = {
  id: string;
  category: 'billing' | 'account' | 'bug' | 'feature_request';
  status: SupportTicketStatus;
  name: string;
  subject: string;
  message: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  inProgressAt: Date | null;
  resolvedAt: Date | null;
};

type AdminSupportClient = {
  supportTicket: {
    findMany: (args: {
      where?: Record<string, unknown>;
      orderBy: Array<{ createdAt?: 'desc' | 'asc'; id?: 'desc' | 'asc' }>;
      take: number;
      skip?: number;
      cursor?: { id: string };
      select: {
        id: true;
        category: true;
        status: true;
        name: true;
        subject: true;
        message: true;
        email: true;
        createdAt: true;
        updatedAt: true;
        inProgressAt: true;
        resolvedAt: true;
      };
    }) => Promise<SupportTicketRecord[]>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
    findUnique: (args: {
      where: { id: string };
      select: {
        id: true;
        status: true;
        inProgressAt: true;
        resolvedAt: true;
      };
    }) => Promise<{
      id: string;
      status: SupportTicketStatus;
      inProgressAt: Date | null;
      resolvedAt: Date | null;
    } | null>;
    update: (args: {
      where: { id: string };
      data: {
        status: SupportTicketStatus;
        updatedAt: Date;
        inProgressAt: Date | null;
        resolvedAt: Date | null;
      };
      select: {
        id: true;
        category: true;
        status: true;
        name: true;
        subject: true;
        message: true;
        email: true;
        createdAt: true;
        updatedAt: true;
        inProgressAt: true;
        resolvedAt: true;
      };
    }) => Promise<SupportTicketRecord>;
  };
};

export type AdminSupportTicketSummary = {
  id: string;
  category: 'billing' | 'account' | 'bug' | 'feature_request';
  status: SupportTicketStatus;
  name: string;
  subject: string;
  message: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  inProgressAt: Date | null;
  resolvedAt: Date | null;
};

export type AdminSupportTicketCounts = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
};

export type AdminSupportTicketListResult = {
  tickets: AdminSupportTicketSummary[];
  counts: AdminSupportTicketCounts;
  nextCursor: string | null;
};

function normalizeLimit(value?: number | null): number {
  if (!value || Number.isNaN(value)) return 20;
  const coerced = Math.floor(value);
  if (coerced < 1) return 1;
  if (coerced > 100) return 100;
  return coerced;
}

function toSummary(ticket: SupportTicketRecord): AdminSupportTicketSummary {
  return {
    id: ticket.id,
    category: ticket.category,
    status: ticket.status,
    name: ticket.name,
    subject: ticket.subject,
    message: ticket.message,
    email: ticket.email,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    inProgressAt: ticket.inProgressAt,
    resolvedAt: ticket.resolvedAt,
  };
}

export async function listAdminSupportTickets(args: {
  prisma: AdminSupportClient;
  status?: SupportTicketStatus | null;
  cursor?: string | null;
  take?: number | null;
}): Promise<AdminSupportTicketListResult> {
  const limit = normalizeLimit(args.take);
  const where = args.status ? { status: args.status } : {};

  const [total, open, inProgress, resolved, tickets] = await Promise.all([
    args.prisma.supportTicket.count(),
    args.prisma.supportTicket.count({ where: { status: 'open' } }),
    args.prisma.supportTicket.count({ where: { status: 'in_progress' } }),
    args.prisma.supportTicket.count({ where: { status: 'resolved' } }),
    args.prisma.supportTicket.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(args.cursor ? { cursor: { id: args.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        category: true,
        status: true,
        name: true,
        subject: true,
        message: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        inProgressAt: true,
        resolvedAt: true,
      },
    }),
  ]);

  if (open + inProgress + resolved > total) {
    throw new ApiError('internal_error', 'Support ticket counts out of range.', 500);
  }

  const hasNext = tickets.length > limit;
  const sliced = hasNext ? tickets.slice(0, limit) : tickets;
  const nextCursor = hasNext ? (sliced[sliced.length - 1]?.id ?? null) : null;

  return {
    tickets: sliced.map(toSummary),
    counts: { total, open, inProgress, resolved },
    nextCursor,
  };
}

export async function updateAdminSupportTicketStatus(args: {
  prisma: AdminSupportClient;
  ticketId: string;
  status: SupportTicketStatus;
  now?: Date;
}): Promise<AdminSupportTicketSummary> {
  const now = args.now ?? new Date();

  const existing = await args.prisma.supportTicket.findUnique({
    where: { id: args.ticketId },
    select: {
      id: true,
      status: true,
      inProgressAt: true,
      resolvedAt: true,
    },
  });
  if (!existing) {
    throw new ApiError('not_found', 'Support ticket not found.', 404);
  }

  const timestamps = applySupportTicketStatusTransition({
    currentStatus: existing.status,
    nextStatus: args.status,
    currentTimestamps: {
      inProgressAt: existing.inProgressAt,
      resolvedAt: existing.resolvedAt,
    },
    changedAt: now,
  });

  const updated = await args.prisma.supportTicket.update({
    where: { id: args.ticketId },
    data: {
      status: args.status,
      updatedAt: now,
      inProgressAt: timestamps.inProgressAt,
      resolvedAt: timestamps.resolvedAt,
    },
    select: {
      id: true,
      category: true,
      status: true,
      name: true,
      subject: true,
      message: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      inProgressAt: true,
      resolvedAt: true,
    },
  });

  return toSummary(updated);
}
