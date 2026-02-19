import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sendEmail } from '../resendClient';
import { sendSupportTicketEmail } from '../sendSupportTicketEmail';

vi.mock('../resendClient', () => ({
  sendEmail: vi.fn(),
}));

const sendEmailMock = vi.mocked(sendEmail);
const originalEnv = { ...process.env };

const setEnv = (overrides: Record<string, string | undefined>) => {
  const next: Record<string, string | undefined> = { ...originalEnv, ...overrides };
  for (const [key, value] of Object.entries(next)) {
    if (value === undefined) {
      delete next[key];
    }
  }
  process.env = next as NodeJS.ProcessEnv;
};

beforeEach(() => {
  setEnv({});
  sendEmailMock.mockReset();
});

afterEach(() => {
  setEnv({});
  vi.restoreAllMocks();
});

describe('sendSupportTicketEmail', () => {
  it('skips sending when test endpoints are enabled', async () => {
    setEnv({
      NODE_ENV: 'test',
      ENABLE_TEST_ENDPOINTS: 'true',
      SUPPORT_INBOX_EMAIL: 'support@example.com',
    });

    await sendSupportTicketEmail({
      ticketId: 'ticket-1',
      category: 'bug',
      name: 'Atlas User',
      email: 'user@example.com',
      subject: 'Issue',
      message: 'Bug details',
      createdAt: new Date('2026-02-19T00:00:00.000Z'),
    });

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('sends ticket details to support inbox', async () => {
    setEnv({
      NODE_ENV: 'test',
      SUPPORT_INBOX_EMAIL: 'support@example.com',
      RESEND_FROM_EMAIL: 'Atlas <noreply@atlas.dev>',
    });

    await sendSupportTicketEmail({
      ticketId: 'ticket-1',
      category: 'feature_request',
      name: 'Atlas User',
      email: 'user@example.com',
      subject: 'Request',
      message: 'Please add something useful.',
      createdAt: new Date('2026-02-19T00:00:00.000Z'),
    });

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const payload = sendEmailMock.mock.calls[0][0];
    expect(payload.from).toBe('Atlas <noreply@atlas.dev>');
    expect(payload.to).toBe('support@example.com');
    expect(payload.subject).toContain('[Feature request] Request');
    expect(payload.html).toContain('ticket-1');
  });

  it('throws in production when inbox is missing', async () => {
    setEnv({
      NODE_ENV: 'production',
      SUPPORT_INBOX_EMAIL: undefined,
    });

    await expect(
      sendSupportTicketEmail({
        ticketId: 'ticket-1',
        category: 'bug',
        name: 'Atlas User',
        email: 'user@example.com',
        subject: 'Issue',
        message: 'Bug details',
        createdAt: new Date('2026-02-19T00:00:00.000Z'),
      }),
    ).rejects.toThrow('SUPPORT_INBOX_EMAIL is not set.');
  });
});
