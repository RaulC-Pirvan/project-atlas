export const AUTH_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const AUTH_SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60;

export const SESSION_TOKEN_COOKIE_NAMES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  '__Host-next-auth.session-token',
] as const;

export const CSRF_COOKIE_NAMES = ['next-auth.csrf-token', '__Host-next-auth.csrf-token'] as const;

export const CALLBACK_COOKIE_NAMES = ['next-auth.callback-url'] as const;

export function shouldUseSecureAuthCookies() {
  return (
    process.env.ENABLE_TEST_ENDPOINTS !== 'true' &&
    process.env.NODE_ENV === 'production' &&
    !!process.env.NEXTAUTH_URL?.startsWith('https://')
  );
}

export function getSessionTokenCookieName() {
  return shouldUseSecureAuthCookies()
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';
}

export function isLegacyJwtSessionToken(value: string): boolean {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
}

export function readSessionTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const entries = cookieHeader.split(';');
  for (const entry of entries) {
    const [rawName, ...rawValueParts] = entry.trim().split('=');
    const name = rawName?.trim();
    if (
      !name ||
      !SESSION_TOKEN_COOKIE_NAMES.includes(name as (typeof SESSION_TOKEN_COOKIE_NAMES)[number])
    ) {
      continue;
    }

    const value = rawValueParts.join('=').trim();
    if (!value) {
      continue;
    }

    return decodeURIComponent(value);
  }

  return null;
}
