import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../db/prisma', () => ({ prisma: {} }));
const resolveGoogleOAuthSignInMock = vi.hoisted(() => vi.fn());
vi.mock('../googleOAuth', () => ({
  resolveGoogleOAuthSignIn: (...args: unknown[]) => resolveGoogleOAuthSignInMock(...args),
}));

const originalEnv = { ...process.env };

const loadAuthOptions = async (env: Record<string, string | undefined>) => {
  process.env = { ...originalEnv };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  vi.resetModules();
  const mod = await import('../nextauth');
  return mod.authOptions;
};

afterEach(() => {
  process.env = { ...originalEnv };
  resolveGoogleOAuthSignInMock.mockReset();
  vi.restoreAllMocks();
});

describe('authOptions', () => {
  it('includes google provider only when credentials are configured', async () => {
    const withoutGoogle = await loadAuthOptions({
      NODE_ENV: 'test',
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
    });
    const withoutGoogleIds = withoutGoogle.providers.map((provider) => provider.id);
    expect(withoutGoogleIds).toEqual(['credentials']);

    const withGoogle = await loadAuthOptions({
      NODE_ENV: 'test',
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
    });
    const withGoogleIds = withGoogle.providers.map((provider) => provider.id);
    expect(withGoogleIds).toEqual(['credentials', 'google']);
  });

  it('does not affect credentials sign-in callback path', async () => {
    const authOptions = await loadAuthOptions({ NODE_ENV: 'test' });
    const result = await authOptions.callbacks?.signIn?.({
      user: { id: 'u1', email: 'user@example.com' },
      account: { provider: 'credentials', type: 'credentials', providerAccountId: 'u1' },
      profile: undefined,
      email: undefined,
      credentials: undefined,
    } as never);

    expect(result).toBe(true);
    expect(resolveGoogleOAuthSignInMock).not.toHaveBeenCalled();
  });

  it('accepts Google sign-in and hydrates JWT/session fields for OAuth user data', async () => {
    const emailVerified = new Date('2026-02-11T00:00:00.000Z');
    resolveGoogleOAuthSignInMock.mockResolvedValueOnce({
      ok: true,
      user: {
        id: 'oauth-user-1',
        email: 'oauth@example.com',
        emailVerified,
        name: 'OAuth User',
        isAdmin: true,
      },
    });

    const authOptions = await loadAuthOptions({
      NODE_ENV: 'test',
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
    });

    const user: {
      id: string;
      email: string | null;
      name: string | null;
      emailVerified?: Date | null;
      isAdmin?: boolean;
    } = { id: 'temp', email: 'temp@example.com', name: 'Temp User' };
    const signInResult = await authOptions.callbacks?.signIn?.({
      user,
      account: {
        provider: 'google',
        providerAccountId: 'google-sub-1',
        type: 'oauth',
        access_token: 'access',
        refresh_token: 'refresh',
        expires_at: 1_735_000_000,
        token_type: 'Bearer',
        scope: 'openid email profile',
      },
      profile: {
        email: 'OAuth@Example.com',
        name: 'OAuth User',
        email_verified: true,
      },
      email: undefined,
      credentials: undefined,
    } as never);

    expect(signInResult).toBe(true);
    expect(resolveGoogleOAuthSignInMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          providerAccountId: 'google-sub-1',
          email: 'OAuth@Example.com',
          emailVerified: true,
          name: 'OAuth User',
        }),
      }),
    );
    expect(user.id).toBe('oauth-user-1');
    expect(user.email).toBe('oauth@example.com');
    expect(user.name).toBe('OAuth User');
    expect(user.emailVerified).toEqual(emailVerified);
    expect(user.isAdmin).toBe(true);

    const token = await authOptions.callbacks?.jwt?.({ token: {}, user } as never);
    expect(token?.userId).toBe('oauth-user-1');
    expect(token?.email).toBe('oauth@example.com');
    expect(token?.name).toBe('OAuth User');
    expect(token?.emailVerifiedAt).toBe('2026-02-11T00:00:00.000Z');
    expect(token?.isAdmin).toBe(true);

    const session = (await authOptions.callbacks?.session?.({
      session: { user: { name: null } },
      token: token ?? {},
    } as never)) as
      | {
          user?: {
            id?: string;
            emailVerifiedAt?: string | null;
            name?: string | null;
            isAdmin?: boolean;
          };
        }
      | undefined;
    expect(session?.user?.id).toBe('oauth-user-1');
    expect(session?.user?.emailVerifiedAt).toBe('2026-02-11T00:00:00.000Z');
    expect(session?.user?.name).toBe('OAuth User');
    expect(session?.user?.isAdmin).toBe(true);
  });

  it('rejects Google sign-in when callback policy denies the account', async () => {
    resolveGoogleOAuthSignInMock.mockResolvedValueOnce({
      ok: false,
      reason: 'deleted_user',
    });

    const authOptions = await loadAuthOptions({
      NODE_ENV: 'test',
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
    });

    const result = await authOptions.callbacks?.signIn?.({
      user: { id: 'u-denied', email: 'denied@example.com' },
      account: {
        provider: 'google',
        providerAccountId: 'google-sub-denied',
        type: 'oauth',
      },
      profile: {
        email: 'denied@example.com',
        email_verified: true,
      },
      email: undefined,
      credentials: undefined,
    } as never);

    expect(result).toBe(false);
  });

  it('passes email_verified=false into callback policy for Google edge cases', async () => {
    resolveGoogleOAuthSignInMock.mockResolvedValueOnce({
      ok: false,
      reason: 'email_not_verified',
    });

    const authOptions = await loadAuthOptions({
      NODE_ENV: 'test',
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
    });

    await authOptions.callbacks?.signIn?.({
      user: { id: 'u-edge', email: 'edge@example.com' },
      account: {
        provider: 'google',
        providerAccountId: 'google-sub-edge',
        type: 'oauth',
      },
      profile: {
        email: 'edge@example.com',
        email_verified: false,
      },
      email: undefined,
      credentials: undefined,
    } as never);

    expect(resolveGoogleOAuthSignInMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          emailVerified: false,
        }),
      }),
    );
  });

  it('populates jwt token fields from user data', async () => {
    const authOptions = await loadAuthOptions({ NODE_ENV: 'test' });
    const jwt = await authOptions.callbacks?.jwt?.({
      token: {},
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Atlas Tester',
        emailVerified: new Date('2026-02-03T00:00:00.000Z'),
        isAdmin: true,
      },
    } as never);

    expect(jwt?.userId).toBe('user-1');
    expect(jwt?.email).toBe('user@example.com');
    expect(jwt?.name).toBe('Atlas Tester');
    expect(jwt?.emailVerifiedAt).toBe('2026-02-03T00:00:00.000Z');
    expect(jwt?.isAdmin).toBe(true);
  });

  it('hydrates session from token data', async () => {
    const authOptions = await loadAuthOptions({ NODE_ENV: 'test' });
    const session = { user: { name: 'Fallback' } };
    const token = {
      userId: 'user-2',
      emailVerifiedAt: '2026-02-04T00:00:00.000Z',
      name: 'Atlas Updated',
      isAdmin: false,
    };

    const result = (await authOptions.callbacks?.session?.({ session, token } as never)) as
      | {
          user?: {
            id?: string;
            emailVerifiedAt?: string | null;
            name?: string | null;
            isAdmin?: boolean;
          };
        }
      | undefined;

    expect(result?.user?.id).toBe('user-2');
    expect(result?.user?.emailVerifiedAt).toBe('2026-02-04T00:00:00.000Z');
    expect(result?.user?.name).toBe('Atlas Updated');
    expect(result?.user?.isAdmin).toBe(false);
  });

  it('uses secure cookies only for production https without test endpoints', async () => {
    const authProdHttps = await loadAuthOptions({
      NODE_ENV: 'production',
      NEXTAUTH_URL: 'https://example.com',
      ENABLE_TEST_ENDPOINTS: undefined,
    });
    expect(authProdHttps.useSecureCookies).toBe(true);

    const authProdHttp = await loadAuthOptions({
      NODE_ENV: 'production',
      NEXTAUTH_URL: 'http://example.com',
      ENABLE_TEST_ENDPOINTS: undefined,
    });
    expect(authProdHttp.useSecureCookies).toBe(false);

    const authTestEndpoints = await loadAuthOptions({
      NODE_ENV: 'production',
      NEXTAUTH_URL: 'https://example.com',
      ENABLE_TEST_ENDPOINTS: 'true',
    });
    expect(authTestEndpoints.useSecureCookies).toBe(false);
  });
});
