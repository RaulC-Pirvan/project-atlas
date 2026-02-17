import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { isPublicPath } from './src/lib/auth/middleware';
import {
  CALLBACK_COOKIE_NAMES,
  CSRF_COOKIE_NAMES,
  isLegacyJwtSessionToken,
  SESSION_TOKEN_COOKIE_NAMES,
  shouldUseSecureAuthCookies,
} from './src/lib/auth/sessionConfig';
import { applySecurityHeaders } from './src/lib/http/securityHeaders';

function clearAuthCookies(response: NextResponse, secure: boolean) {
  for (const name of SESSION_TOKEN_COOKIE_NAMES) {
    response.cookies.set({
      name,
      value: '',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'lax',
      secure,
    });
  }

  for (const name of CSRF_COOKIE_NAMES) {
    response.cookies.set({
      name,
      value: '',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'lax',
      secure,
    });
  }

  for (const name of CALLBACK_COOKIE_NAMES) {
    response.cookies.set({
      name,
      value: '',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: false,
      sameSite: 'lax',
      secure,
    });
  }
}

function getSessionToken(request: NextRequest): string | null {
  for (const name of SESSION_TOKEN_COOKIE_NAMES) {
    const value = request.cookies.get(name)?.value;
    if (value) {
      return value;
    }
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    applySecurityHeaders(response.headers);
    return response;
  }

  const secure = shouldUseSecureAuthCookies();
  const sessionToken = getSessionToken(request);
  const isApiRoute = pathname.startsWith('/api/');

  if (!sessionToken) {
    if (isApiRoute) {
      const response = NextResponse.json(
        {
          error: 'Unauthorized',
          recovery: 'Sign in to continue.',
        },
        { status: 401 },
      );
      applySecurityHeaders(response.headers);
      return response;
    }

    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('from', pathname);
    const response = NextResponse.redirect(signInUrl);
    applySecurityHeaders(response.headers);
    return response;
  }

  if (isLegacyJwtSessionToken(sessionToken)) {
    if (isApiRoute) {
      const response = NextResponse.json(
        {
          error: 'Unauthorized',
          recovery: 'Session upgraded. Sign in again.',
        },
        { status: 401 },
      );
      clearAuthCookies(response, secure);
      applySecurityHeaders(response.headers);
      return response;
    }

    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('from', pathname);
    signInUrl.searchParams.set('reason', 'session-upgrade');
    const response = NextResponse.redirect(signInUrl);
    clearAuthCookies(response, secure);
    applySecurityHeaders(response.headers);
    return response;
  }

  const response = NextResponse.next();
  applySecurityHeaders(response.headers);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
