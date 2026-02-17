import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import { isAdminEmail } from '../admin/access';
import { prisma } from '../db/prisma';
import { resolveGoogleOAuthSignIn } from './googleOAuth';
import {
  AUTH_SESSION_MAX_AGE_SECONDS,
  AUTH_SESSION_UPDATE_AGE_SECONDS,
  shouldUseSecureAuthCookies,
} from './sessionConfig';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'database',
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
    updateAge: AUTH_SESSION_UPDATE_AGE_SECONDS,
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
    async session({ session, token, user }) {
      if (session.user) {
        const jwtToken = token as
          | {
              userId?: string;
              emailVerifiedAt?: string | null;
              name?: string | null;
              isAdmin?: boolean;
            }
          | undefined;
        const dbUser = user as
          | {
              id?: string;
              email?: string | null;
              emailVerified?: Date | null;
              displayName?: string | null;
              role?: 'user' | 'admin';
            }
          | undefined;
        const tokenUserId = typeof jwtToken?.userId === 'string' ? jwtToken.userId : null;
        const userId = dbUser?.id ?? tokenUserId ?? null;
        if (userId) {
          session.user.id = userId;
        }

        const dbEmailVerifiedAt = dbUser?.emailVerified ? dbUser.emailVerified.toISOString() : null;
        session.user.emailVerifiedAt = dbEmailVerifiedAt ?? jwtToken?.emailVerifiedAt ?? null;

        const dbName = dbUser?.displayName ?? null;
        session.user.name = dbName ?? jwtToken?.name ?? session.user.name ?? null;

        const email = dbUser?.email ?? session.user.email ?? null;
        session.user.isAdmin =
          dbUser?.role === 'admin' ||
          (typeof jwtToken?.isAdmin === 'boolean' ? jwtToken.isAdmin : false) ||
          isAdminEmail(email);
      }
      return session;
    },
  },
  useSecureCookies: shouldUseSecureAuthCookies(),
  secret: process.env.NEXTAUTH_SECRET,
};
