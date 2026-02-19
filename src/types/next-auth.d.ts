import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      emailVerifiedAt?: string | null;
      isAdmin?: boolean;
      twoFactorEnabled?: boolean;
    };
  }

  interface User {
    id: string;
    emailVerified?: Date | null;
    isAdmin?: boolean;
    twoFactorEnabled?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    emailVerifiedAt?: string | null;
    email?: string | null;
    isAdmin?: boolean;
    twoFactorEnabled?: boolean;
  }
}
