import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

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

  if (token) {
    const response = NextResponse.next();
    applySecurityHeaders(response.headers);
    return response;
  }

  const signInUrl = new URL('/sign-in', request.url);
  signInUrl.searchParams.set('from', pathname);
  const response = NextResponse.redirect(signInUrl);
  applySecurityHeaders(response.headers);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
