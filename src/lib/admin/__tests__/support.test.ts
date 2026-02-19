import { describe, expect, it } from 'vitest';

import { listAdminSupportTickets, updateAdminSupportTicketStatus } from '../support';

describe('admin support services', () => {
  it('lists support tickets with counts', async () => {
    const prisma = {
      supportTicket: {
        count: async ({ where }: { where?: Record<string, unknown> } = {}) => {
          if (where?.status === 'open') return 1;
          if (where?.status === 'in_progress') return 0;
          if (where?.status === 'resolved') return 0;
          return 1;
        },
        findMany: async () => [
          {
            id: 'ticket-1',
            category: 'bug' as const,
            status: 'open' as const,
            name: 'Atlas User',
            subject: 'Issue',
            message: 'Calendar check-in toggle does not update until a full page refresh.',
            email: 'user@example.com',
            createdAt: new Date('2026-02-19T00:00:00.000Z'),
            updatedAt: new Date('2026-02-19T00:00:00.000Z'),
            inProgressAt: null,
            resolvedAt: null,
          },
        ],
        findUnique: async () => null,
        update: async () => {
          throw new Error('not used');
        },
      },
    };

    const result = await listAdminSupportTickets({ prisma });
    expect(result.counts.total).toBe(1);
    expect(result.tickets).toHaveLength(1);
    expect(result.tickets[0]?.status).toBe('open');
    expect(result.tickets[0]?.name).toBe('Atlas User');
    expect(result.tickets[0]?.message).toContain('Calendar check-in');
  });

  it('updates support ticket status with lifecycle timestamps', async () => {
    const now = new Date('2026-02-19T12:00:00.000Z');
    const prisma = {
      supportTicket: {
        count: async () => 0,
        findMany: async () => [],
        findUnique: async () => ({
          id: 'ticket-1',
          status: 'open' as const,
          inProgressAt: null,
          resolvedAt: null,
        }),
        update: async () => ({
          id: 'ticket-1',
          category: 'bug' as const,
          status: 'in_progress' as const,
          name: 'Atlas User',
          subject: 'Issue',
          message: 'Calendar check-in toggle does not update until a full page refresh.',
          email: 'user@example.com',
          createdAt: new Date('2026-02-19T00:00:00.000Z'),
          updatedAt: now,
          inProgressAt: now,
          resolvedAt: null,
        }),
      },
    };

    const result = await updateAdminSupportTicketStatus({
      prisma,
      ticketId: 'ticket-1',
      status: 'in_progress',
      now,
    });

    expect(result.status).toBe('in_progress');
    expect(result.inProgressAt?.toISOString()).toBe('2026-02-19T12:00:00.000Z');
  });
});
