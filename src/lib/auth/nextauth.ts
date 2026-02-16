import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import { prisma } from '../db/prisma';
import { authorizeCredentials } from './credentials';
import { resolveGoogleOAuthSignIn } from './googleOAuth';
import { generateToken } from './tokens';

const shouldUseSecureCookies =
  process.env.ENABLE_TEST_ENDPOINTS !== 'true' &&
  process.env.NODE_ENV === 'production' &&
  !!process.env.NEXTAUTH_URL?.startsWith('https://');

const testGoogleProviderEnabled =
  process.env.ENABLE_TEST_ENDPOINTS === 'true' &&
  process.env.ENABLE_TEST_GOOGLE_OAUTH_PROVIDER === 'true';

const testGoogleProviderId = process.env.NEXT_PUBLIC_ATLAS_GOOGLE_PROVIDER_ID || 'google-test';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email =
          typeof credentials?.email === 'string' ? credentials.email.toLowerCase() : 'unknown';

        return authorizeCredentials({
          prisma,
          credentials,
          rateLimitKey: email,
        });
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(testGoogleProviderEnabled
      ? [
          CredentialsProvider({
            id: testGoogleProviderId,
            name: 'Google (Test)',
            credentials: {
              email: { label: 'Email', type: 'email' },
              name: { label: 'Name', type: 'text' },
              providerAccountId: { label: 'Provider Account ID', type: 'text' },
              emailVerified: { label: 'Email Verified', type: 'text' },
            },
            authorize: async (credentials) => {
              const rawProviderAccountId =
                typeof credentials?.providerAccountId === 'string'
                  ? credentials.providerAccountId.trim()
                  : '';
              const providerAccountId = rawProviderAccountId || `google-test-${generateToken(8)}`;

              const rawEmail =
                typeof credentials?.email === 'string'
                  ? credentials.email.trim().toLowerCase()
                  : '';
              const email = rawEmail || `${providerAccountId}@example.com`;
              const name =
                typeof credentials?.name === 'string' && credentials.name.trim().length > 0
                  ? credentials.name.trim()
                  : 'Atlas OAuth Tester';
              const emailVerified =
                typeof credentials?.emailVerified === 'string'
                  ? credentials.emailVerified !== 'false'
                  : true;

              const result = await resolveGoogleOAuthSignIn({
                prisma,
                input: {
                  providerAccountId,
                  email,
                  emailVerified,
                  name,
                  account: { type: 'oauth' },
                },
              });

              if (!result.ok) {
                return null;
              }

              return {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                emailVerified: result.user.emailVerified,
                isAdmin: result.user.isAdmin,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google') {
        return true;
      }

      const profileData = profile as Record<string, unknown> | undefined;
      const profileEmail =
        typeof profileData?.email === 'string' && profileData.email.length > 0
          ? profileData.email
          : null;
      const userEmail = typeof user.email === 'string' && user.email.length > 0 ? user.email : null;
      const profileName = typeof profileData?.name === 'string' ? profileData.name : null;
      const userName = typeof user.name === 'string' ? user.name : null;
      const rawEmailVerified =
        typeof profileData?.email_verified === 'boolean' ? profileData.email_verified : false;

      const result = await resolveGoogleOAuthSignIn({
        prisma,
        input: {
          providerAccountId: account.providerAccountId ?? null,
          email: profileEmail ?? userEmail,
          emailVerified: rawEmailVerified,
          name: profileName ?? userName,
          account: {
            type: account.type,
            refreshToken: typeof account.refresh_token === 'string' ? account.refresh_token : null,
            accessToken: typeof account.access_token === 'string' ? account.access_token : null,
            expiresAt: typeof account.expires_at === 'number' ? account.expires_at : null,
            tokenType: typeof account.token_type === 'string' ? account.token_type : null,
            scope: typeof account.scope === 'string' ? account.scope : null,
            idToken: typeof account.id_token === 'string' ? account.id_token : null,
            sessionState: typeof account.session_state === 'string' ? account.session_state : null,
          },
        },
      });

      if (!result.ok) {
        return false;
      }

      user.id = result.user.id;
      user.email = result.user.email;
      user.name = result.user.name;
      user.emailVerified = result.user.emailVerified;
      user.isAdmin = result.user.isAdmin;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const emailVerified = 'emailVerified' in user ? (user.emailVerified as Date | null) : null;
        token.userId = user.id;
        token.emailVerifiedAt = emailVerified ? emailVerified.toISOString() : null;
        token.name = typeof user.name === 'string' ? user.name : null;
        token.email = typeof user.email === 'string' ? user.email : null;
        token.isAdmin = typeof user.isAdmin === 'boolean' ? user.isAdmin : false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.emailVerifiedAt = (token.emailVerifiedAt as string | null) ?? null;
        session.user.name = (token.name as string | null) ?? session.user.name ?? null;
        session.user.isAdmin = (token.isAdmin as boolean | undefined) ?? false;
      }
      return session;
    },
  },
  useSecureCookies: shouldUseSecureCookies,
  secret: process.env.NEXTAUTH_SECRET,
};
