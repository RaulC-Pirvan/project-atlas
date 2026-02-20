import { beforeEach, describe, expect, it, vi } from 'vitest';

const getServerSessionMock = vi.hoisted(() => vi.fn());
const supportSignalCountMock = vi.hoisted(() => vi.fn());
const supportSignalCreateManyMock = vi.hoisted(() => vi.fn());
const supportTicketCountMock = vi.hoisted(() => vi.fn());
const transactionSupportTicketCreateMock = vi.hoisted(() => vi.fn());
const transactionSupportSignalCreateManyMock = vi.hoisted(() => vi.fn());
const transactionMock = vi.hoisted(() => vi.fn());
const isSupportCaptchaConfiguredMock = vi.hoisted(() => vi.fn());
const verifySupportCaptchaMock = vi.hoisted(() => vi.fn());
const sendSupportTicketEmailMock = vi.hoisted(() => vi.fn());

vi.mock('next-auth/next', () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock('../../../../lib/db/prisma', () => ({
  prisma: {
    supportAbuseSignal: {
      count: (...args: unknown[]) => supportSignalCountMock(...args),
      createMany: (...args: unknown[]) => supportSignalCreateManyMock(...args),
    },
    supportTicket: {
      count: (...args: unknown[]) => supportTicketCountMock(...args),
    },
    $transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

vi.mock('../../../../lib/support/captcha', () => ({
  isSupportCaptchaConfigured: (...args: unknown[]) => isSupportCaptchaConfiguredMock(...args),
  verifySupportCaptcha: (...args: unknown[]) => verifySupportCaptchaMock(...args),
}));

vi.mock('../../../../infra/email/sendSupportTicketEmail', () => ({
  sendSupportTicketEmail: (...args: unknown[]) => sendSupportTicketEmailMock(...args),
}));

describe('POST /api/support/tickets', () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    supportSignalCountMock.mockReset();
    supportSignalCreateManyMock.mockReset();
    supportTicketCountMock.mockReset();
    transactionSupportTicketCreateMock.mockReset();
    transactionSupportSignalCreateManyMock.mockReset();
    transactionMock.mockReset();
    isSupportCaptchaConfiguredMock.mockReset();
    verifySupportCaptchaMock.mockReset();
    sendSupportTicketEmailMock.mockReset();

    getServerSessionMock.mockResolvedValue(null);
    isSupportCaptchaConfiguredMock.mockReturnValue(false);
    verifySupportCaptchaMock.mockResolvedValue({ ok: false });
    supportSignalCreateManyMock.mockResolvedValue({ count: 1 });
    transactionSupportSignalCreateManyMock.mockResolvedValue({ count: 1 });
    transactionSupportTicketCreateMock.mockResolvedValue({ id: 'ticket-1' });
    sendSupportTicketEmailMock.mockResolvedValue(undefined);
    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        supportTicket: { create: transactionSupportTicketCreateMock },
        supportAbuseSignal: { createMany: transactionSupportSignalCreateManyMock },
      }),
    );
  });

  it('accepts valid submissions and persists ticket + abuse metadata', async () => {
    supportSignalCountMock.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    supportTicketCountMock.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const { POST } = await import('../tickets/route');
    const response = await POST(
      new Request('http://localhost:3000/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.42',
        },
        body: JSON.stringify({
          name: 'Atlas User',
          email: 'user@example.com',
          category: 'bug',
          subject: 'Issue',
          message: 'I cannot submit my habit update from calendar view.',
          honeypot: '',
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, data: { accepted: true } });
    expect(transactionSupportTicketCreateMock).toHaveBeenCalledTimes(1);
    expect(transactionSupportSignalCreateManyMock).toHaveBeenCalledTimes(1);
    expect(sendSupportTicketEmailMock).toHaveBeenCalledTimes(1);
  });

  it('returns generic success and skips ticket persistence for honeypot submissions', async () => {
    const { POST } = await import('../tickets/route');
    const response = await POST(
      new Request('http://localhost:3000/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Atlas User',
          email: 'user@example.com',
          category: 'bug',
          subject: 'Issue',
          message: 'I cannot submit my habit update from calendar view.',
          honeypot: 'bot-value',
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, data: { accepted: true } });
    expect(supportSignalCreateManyMock).toHaveBeenCalledTimes(1);
    expect(transactionSupportTicketCreateMock).not.toHaveBeenCalled();
    expect(sendSupportTicketEmailMock).not.toHaveBeenCalled();
  });

  it('rate limits when per-IP submission threshold is exceeded', async () => {
    supportSignalCountMock.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    supportTicketCountMock.mockResolvedValueOnce(5).mockResolvedValueOnce(0);

    const { POST } = await import('../tickets/route');
    const response = await POST(
      new Request('http://localhost:3000/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.42',
        },
        body: JSON.stringify({
          name: 'Atlas User',
          email: 'user@example.com',
          category: 'bug',
          subject: 'Issue',
          message: 'I cannot submit my habit update from calendar view.',
          honeypot: '',
        }),
      }),
    );

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('rate_limited');
    expect(supportSignalCreateManyMock).toHaveBeenCalledTimes(1);
  });

  it('requires captcha after abuse threshold and returns 429 when captcha is unavailable', async () => {
    supportSignalCountMock.mockResolvedValueOnce(7).mockResolvedValueOnce(0);

    const { POST } = await import('../tickets/route');
    const response = await POST(
      new Request('http://localhost:3000/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '203.0.113.42',
        },
        body: JSON.stringify({
          name: 'Atlas User',
          email: 'user@example.com',
          category: 'bug',
          subject: 'Issue',
          message: 'I cannot submit my habit update from calendar view.',
          honeypot: '',
        }),
      }),
    );

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('rate_limited');
  });
});
