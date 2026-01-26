import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      emailVerifiedAt?: string | null;
    };
  }

  interface User {
    id: string;
    emailVerified?: Date | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    emailVerifiedAt?: string | null;
  }
}
