import { NextResponse } from 'next/server';

import { AUTH_RATE_LIMIT, shouldBypassAuthRateLimit } from '../../../../lib/auth/authRateLimit';
import {
  applyRateLimitHeaders,
  consumeRateLimit,
  getRateLimitKey,
} from '../../../../lib/http/rateLimit';
import { withApiLogging } from '../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

const HTTP_ONLY_COOKIES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  '__Host-next-auth.session-token',
  'next-auth.csrf-token',
  '__Host-next-auth.csrf-token',
];

const NON_HTTP_ONLY_COOKIES = ['next-auth.callback-url'];

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

    const response = NextResponse.json({ ok: true });
    const isSecure = process.env.NODE_ENV === 'production';

    for (const name of HTTP_ONLY_COOKIES) {
      response.cookies.set({
        name,
        value: '',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        httpOnly: true,
        sameSite: 'lax',
        secure: isSecure,
      });
    }

    for (const name of NON_HTTP_ONLY_COOKIES) {
      response.cookies.set({
        name,
        value: '',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        httpOnly: false,
        sameSite: 'lax',
        secure: isSecure,
      });
    }

    return response;
  });
}
