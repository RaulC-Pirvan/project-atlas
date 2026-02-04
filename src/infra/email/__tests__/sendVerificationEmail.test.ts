import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as debugTokenStore from '../debugTokenStore';
import { sendEmail } from '../resendClient';
import { sendVerificationEmail } from '../sendVerificationEmail';

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

describe('sendVerificationEmail', () => {
  it('stores tokens and skips sending when test endpoints are enabled', async () => {
    setEnv({ NODE_ENV: 'test', ENABLE_TEST_ENDPOINTS: 'true' });

    await sendVerificationEmail({
      to: 'user@example.com',
      token: 'token-123',
      userId: 'user-1',
      baseUrl: 'https://example.com',
    });

    expect(debugTokenStore.getLatestVerificationToken('user@example.com')).toBe('token-123');
    expect(debugTokenStore.getLatestVerificationTokenForUser('user-1')).toBe('token-123');
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('sends a verification email with the correct link', async () => {
    setEnv({
      NODE_ENV: 'test',
      ENABLE_TEST_ENDPOINTS: undefined,
      RESEND_FROM_EMAIL: 'Atlas <noreply@atlas.dev>',
    });

    await sendVerificationEmail({
      to: 'user@example.com',
      token: 'token-abc',
      baseUrl: 'https://example.com',
    });

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const args = sendEmailMock.mock.calls[0][0];
    expect(args.from).toBe('Atlas <noreply@atlas.dev>');
    expect(args.to).toBe('user@example.com');
    expect(args.subject).toBe('Verify your email');
    expect(args.html).toContain('https://example.com/verify-email?token=token-abc');
  });

  it('warns but does not throw when send fails in non-production', async () => {
    setEnv({ NODE_ENV: 'test', ENABLE_TEST_ENDPOINTS: undefined });
    sendEmailMock.mockRejectedValue(new Error('send failed'));

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(
      sendVerificationEmail({
        to: 'user@example.com',
        token: 'token-fail',
      }),
    ).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalled();
  });

  it('throws when send fails in production', async () => {
    setEnv({ NODE_ENV: 'production', ENABLE_TEST_ENDPOINTS: undefined });
    sendEmailMock.mockRejectedValue(new Error('send failed'));

    await expect(
      sendVerificationEmail({
        to: 'user@example.com',
        token: 'token-prod',
      }),
    ).rejects.toThrow('send failed');
  });
});
