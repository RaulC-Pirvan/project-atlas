const BASE_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'X-DNS-Prefetch-Control': 'off',
};

const HSTS_HEADER = 'max-age=63072000; includeSubDomains; preload';

type SecurityHeaderOptions = {
  isProduction?: boolean;
};

export function applySecurityHeaders(headers: Headers, options: SecurityHeaderOptions = {}) {
  for (const [key, value] of Object.entries(BASE_HEADERS)) {
    headers.set(key, value);
  }

  const isProduction = options.isProduction ?? process.env.NODE_ENV === 'production';
  if (isProduction) {
    headers.set('Strict-Transport-Security', HSTS_HEADER);
  }
}
