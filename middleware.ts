import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

import { isAdminApiPath, isAdminEmail, isAdminPath } from './src/lib/admin/access';
import { isPublicPath } from './src/lib/auth/middleware';
import { applySecurityHeaders } from './src/lib/http/securityHeaders';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    applySecurityHeaders(response.headers);
    return response;
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('from', pathname);
    const response = NextResponse.redirect(signInUrl);
    applySecurityHeaders(response.headers);
    return response;
  }

  if (isAdminPath(pathname) || isAdminApiPath(pathname)) {
    const email = typeof token.email === 'string' ? token.email : null;
    const isAdmin = typeof token.isAdmin === 'boolean' ? token.isAdmin : false;

    if (!isAdmin && !isAdminEmail(email)) {
      if (isAdminApiPath(pathname)) {
        const response = NextResponse.json(
          {
            error: 'Forbidden',
            recovery: 'Admin access is restricted to the configured allowlist.',
          },
          { status: 403 },
        );
        applySecurityHeaders(response.headers);
        return response;
      }

      const response = NextResponse.redirect(new URL('/calendar', request.url));
      applySecurityHeaders(response.headers);
      return response;
    }
  }

  const response = NextResponse.next();
  applySecurityHeaders(response.headers);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
