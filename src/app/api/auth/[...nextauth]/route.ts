import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';

import { authOptions } from '../../../../lib/auth/nextauth';
import { withApiLogging } from '../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

const handler = NextAuth(authOptions);

const loggedHandler = async (request: NextRequest) =>
  withApiLogging(request, { route: '/api/auth/[...nextauth]' }, async () => handler(request));

export { loggedHandler as GET, loggedHandler as POST };
