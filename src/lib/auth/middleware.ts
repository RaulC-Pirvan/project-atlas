const PUBLIC_PATHS = new Set([
  '/',
  '/landing',
  '/sign-in',
  '/sign-up',
  '/verify-email',
  '/support',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]);

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname === '/legal' || pathname.startsWith('/legal/')) return true;
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname.startsWith('/api/health')) return true;
  if (pathname.startsWith('/api/support')) return true;
  if (pathname.startsWith('/_obs')) return true;
  if (pathname.startsWith('/_next')) return true;
  return false;
}
