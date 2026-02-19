import { getServerSession } from 'next-auth/next';
import { describe, expect, it, vi } from 'vitest';

import { requireAdminSession } from '../../../../lib/admin/auth';
import { updateAdminSupportTicketStatus } from '../../../../lib/admin/support';
import { PATCH } from '../support/[id]/route';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('../../../../lib/db/prisma', () => ({ prisma: {} }));
vi.mock('../../../../lib/admin/auth', () => ({ requireAdminSession: vi.fn() }));
vi.mock('../../../../lib/admin/support', () => ({ updateAdminSupportTicketStatus: vi.fn() }));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedUpdateAdminSupportTicketStatus = vi.mocked(updateAdminSupportTicketStatus);

describe('PATCH /api/admin/support/[id]', () => {
  it('updates ticket status for admins', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockedRequireAdminSession.mockResolvedValue({
      userId: 'admin-1',
      email: 'admin@example.com',
      twoFactorEnabled: true,
    });
    mockedGetServerSession.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@example.com' },
    });
    mockedUpdateAdminSupportTicketStatus.mockResolvedValue({
      id: 'ticket-1',
      category: 'bug',
      status: 'resolved',
      name: 'Atlas User',
      subject: 'Issue',
      message: 'Calendar check-in toggle does not update until a full page refresh.',
      email: 'user@example.com',
      createdAt: new Date('2026-02-19T00:00:00.000Z'),
      updatedAt: new Date('2026-02-19T01:00:00.000Z'),
      inProgressAt: new Date('2026-02-19T00:30:00.000Z'),
      resolvedAt: new Date('2026-02-19T01:00:00.000Z'),
    });

    const response = await PATCH(
      new Request('https://example.com/api/admin/support/ticket-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      }),
      { params: Promise.resolve({ id: 'ticket-1' }) },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.ticket.status).toBe('resolved');

    expect(mockedRequireAdminSession).toHaveBeenCalled();
    expect(mockedUpdateAdminSupportTicketStatus).toHaveBeenCalled();

    logSpy.mockRestore();
  });
});
