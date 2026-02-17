import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authorizeCredentialsMock = vi.hoisted(() => vi.fn());
const createDatabaseSessionMock = vi.hoisted(() => vi.fn());

vi.mock('../../../../lib/db/prisma', () => ({ prisma: {} }));
vi.mock('../../../../lib/auth/credentials', () => ({
  authorizeCredentials: (...args: unknown[]) => authorizeCredentialsMock(...args),
}));
vi.mock('../../../../lib/auth/databaseSession', () => ({
  createDatabaseSession: (...args: unknown[]) => createDatabaseSessionMock(...args),
}));

describe('/api/auth/sign-in', () => {
  beforeEach(() => {
    vi.stubEnv('ENABLE_TEST_ENDPOINTS', 'true');
    vi.stubEnv('NODE_ENV', 'test');
    authorizeCredentialsMock.mockReset();
    createDatabaseSessionMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('creates a database session and sets cookie on valid credentials', async () => {
    const now = new Date('2026-02-17T10:00:00.000Z');
    authorizeCredentialsMock.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: now,
      name: 'Atlas User',
      isAdmin: false,
    });
    createDatabaseSessionMock.mockResolvedValueOnce({
      sessionToken: 'db-session-token',
      expires: new Date('2026-03-19T10:00:00.000Z'),
    });

    const { POST } = await import('../sign-in/route');
    const response = await POST(
      new Request('http://localhost:3000/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ok: true, data: { ok: true } });
    expect(authorizeCredentialsMock).toHaveBeenCalled();
    expect(createDatabaseSessionMock).toHaveBeenCalled();
    expect(response.headers.get('set-cookie')).toContain(
      'next-auth.session-token=db-session-token',
    );
  });

  it('returns invalid credentials error when credentials fail', async () => {
    authorizeCredentialsMock.mockResolvedValueOnce(null);

    const { POST } = await import('../sign-in/route');
    const response = await POST(
      new Request('http://localhost:3000/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
      }),
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('invalid_credentials');
  });

  it('returns unverified error when credentials policy throws EMAIL_NOT_VERIFIED', async () => {
    authorizeCredentialsMock.mockRejectedValueOnce(new Error('EMAIL_NOT_VERIFIED'));

    const { POST } = await import('../sign-in/route');
    const response = await POST(
      new Request('http://localhost:3000/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
      }),
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('email_not_verified');
  });
});
