import { getServerSession } from 'next-auth/next';
import { describe, expect, it, vi } from 'vitest';

import { requireAdminSession } from '../../../../lib/admin/auth';
import { listAdminSupportTickets } from '../../../../lib/admin/support';
import { GET } from '../support/route';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/db/prisma', () => ({ prisma: {} }));
vi.mock('../../../../lib/admin/auth', () => ({ requireAdminSession: vi.fn() }));
vi.mock('../../../../lib/admin/support', () => ({ listAdminSupportTickets: vi.fn() }));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedListAdminSupportTickets = vi.mocked(listAdminSupportTickets);

describe('GET /api/admin/support', () => {
  it('returns support ticket list for admins', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockedRequireAdminSession.mockResolvedValue({
      userId: 'admin-1',
      email: 'admin@example.com',
      twoFactorEnabled: true,
    });
    mockedGetServerSession.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@example.com' },
    });
    mockedListAdminSupportTickets.mockResolvedValue({
      tickets: [
        {
          id: 'ticket-1',
          category: 'bug',
          status: 'open',
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
      counts: { total: 1, open: 1, inProgress: 0, resolved: 0 },
      nextCursor: null,
    });

    const response = await GET(new Request('https://example.com/api/admin/support?status=open'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.tickets).toHaveLength(1);

    expect(mockedRequireAdminSession).toHaveBeenCalled();
    expect(mockedListAdminSupportTickets).toHaveBeenCalled();

    logSpy.mockRestore();
  });
});
