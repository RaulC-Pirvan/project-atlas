import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { prisma } from '../db/prisma';
import { authorizeCredentials } from './credentials';

const shouldUseSecureCookies =
  process.env.ENABLE_TEST_ENDPOINTS !== 'true' &&
  process.env.NODE_ENV === 'production' &&
  !!process.env.NEXTAUTH_URL?.startsWith('https://');

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
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const emailVerified = 'emailVerified' in user ? (user.emailVerified as Date | null) : null;
        token.userId = user.id;
        token.emailVerifiedAt = emailVerified ? emailVerified.toISOString() : null;
        token.name = typeof user.name === 'string' ? user.name : null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.emailVerifiedAt = (token.emailVerifiedAt as string | null) ?? null;
        session.user.name = (token.name as string | null) ?? session.user.name ?? null;
      }
      return session;
    },
  },
  useSecureCookies: shouldUseSecureCookies,
  secret: process.env.NEXTAUTH_SECRET,
};
