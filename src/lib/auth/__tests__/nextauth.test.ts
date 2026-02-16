import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../db/prisma', () => ({ prisma: {} }));

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
