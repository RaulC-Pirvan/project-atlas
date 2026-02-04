import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';

import { authOptions } from '../../../../lib/auth/nextauth';
import { withApiLogging } from '../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

const handler = NextAuth(authOptions);

type AuthRouteContext = {
  params: Promise<{ nextauth: string[] }>;
};

const loggedHandler = async (request: NextRequest, context: AuthRouteContext) =>
  withApiLogging(request, { route: '/api/auth/[...nextauth]' }, async () =>
    handler(request, context),
  );

export { loggedHandler as GET, loggedHandler as POST };
