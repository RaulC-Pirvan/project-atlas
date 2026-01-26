import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

import { isPublicPath } from './src/lib/auth/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (token) {
    return NextResponse.next();
  }

  const signInUrl = new URL('/sign-in', request.url);
  signInUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
