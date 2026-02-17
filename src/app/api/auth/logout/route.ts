import { NextResponse } from 'next/server';

import { AUTH_RATE_LIMIT, shouldBypassAuthRateLimit } from '../../../../lib/auth/authRateLimit';
import { revokeDatabaseSessionByToken } from '../../../../lib/auth/databaseSession';
import {
  readSessionTokenFromCookieHeader,
} from '../../../../lib/auth/sessionConfig';
import { clearAuthCookies } from '../../../../lib/auth/sessionCookies';
import { prisma } from '../../../../lib/db/prisma';
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  getRateLimitKey,
} from '../../../../lib/http/rateLimit';
import { withApiLogging } from '../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  return withApiLogging(request, { route: '/api/auth/logout' }, async () => {
    if (!shouldBypassAuthRateLimit()) {
      const decision = consumeRateLimit(getRateLimitKey('auth:logout', request), AUTH_RATE_LIMIT);
      if (decision.limited) {
        const response = NextResponse.json(
          {
            ok: false,
            error: {
              code: 'rate_limited',
              message: 'Too many requests. Try again later.',
              recovery: 'retry_later',
            },
          },
          { status: 429 },
        );
        applyRateLimitHeaders(response.headers, decision);
        return response;
      }
    }

    const sessionToken = readSessionTokenFromCookieHeader(request.headers.get('cookie'));
    if (sessionToken) {
      await revokeDatabaseSessionByToken(prisma, sessionToken);
    }

    const response = NextResponse.json({ ok: true });
    clearAuthCookies(response);

    return response;
  });
}
