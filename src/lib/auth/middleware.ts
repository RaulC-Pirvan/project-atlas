const PUBLIC_PATHS = new Set([
  '/',
  '/sign-in',
  '/sign-up',
  '/verify-email',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]);

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname.startsWith('/_next')) return true;
  return false;
}
