import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const revokeDatabaseSessionByTokenMock = vi.hoisted(() => vi.fn());

vi.mock('../../../../lib/db/prisma', () => ({ prisma: {} }));
vi.mock('../../../../lib/auth/databaseSession', () => ({
  revokeDatabaseSessionByToken: (...args: unknown[]) => revokeDatabaseSessionByTokenMock(...args),
}));

describe('/api/auth/logout', () => {
  beforeEach(() => {
    vi.stubEnv('ENABLE_TEST_ENDPOINTS', 'true');
    vi.stubEnv('NODE_ENV', 'test');
    revokeDatabaseSessionByTokenMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('revokes current database session and clears auth cookies', async () => {
    revokeDatabaseSessionByTokenMock.mockResolvedValueOnce({ count: 1 });

    const { POST } = await import('../logout/route');
    const response = await POST(
      new Request('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          cookie: 'next-auth.session-token=active-session-token',
        },
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true });
    expect(revokeDatabaseSessionByTokenMock).toHaveBeenCalledWith({}, 'active-session-token');
    expect(response.headers.get('set-cookie')).toContain('next-auth.session-token=');
  });
});
