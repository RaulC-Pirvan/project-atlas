import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sendEmail } from '../resendClient';

const baseArgs = {
  from: 'Project Atlas <noreply@projectatlas.dev>',
  to: 'user@example.com',
  subject: 'Test email',
  html: '<p>Hello</p>',
};

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
});

afterEach(() => {
  setEnv({});
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('sendEmail', () => {
  it('skips sending when api key is missing in non-production', async () => {
    setEnv({ RESEND_API_KEY: '', NODE_ENV: 'test' });

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await sendEmail(baseArgs);

    expect(result).toEqual({ delivered: false, skipped: true });
    expect(warn).toHaveBeenCalled();
  });

  it('throws when api key is missing in production', async () => {
    setEnv({ RESEND_API_KEY: '', NODE_ENV: 'production' });

    await expect(sendEmail(baseArgs)).rejects.toThrow('RESEND_API_KEY is not set.');
  });

  it('posts to Resend when api key is present', async () => {
    setEnv({ RESEND_API_KEY: 'test-key', NODE_ENV: 'test' });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email-123' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendEmail(baseArgs);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.resend.com/emails');
    expect(result).toEqual({ delivered: true, id: 'email-123' });
  });

  it('throws when Resend responds with an error', async () => {
    setEnv({ RESEND_API_KEY: 'test-key', NODE_ENV: 'test' });

    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendEmail(baseArgs)).rejects.toThrow('Resend API error: 500');
  });
});
