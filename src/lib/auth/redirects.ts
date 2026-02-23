export const DEFAULT_POST_AUTH_PATH = '/today' as const;

const MAX_REDIRECT_PATH_LENGTH = 512;

export function resolveSafePostAuthPath(value: string | null | undefined): string {
  if (!value) return DEFAULT_POST_AUTH_PATH;
  const normalized = value.trim();
  if (!normalized) return DEFAULT_POST_AUTH_PATH;
  if (normalized.length > MAX_REDIRECT_PATH_LENGTH) return DEFAULT_POST_AUTH_PATH;
  if (!normalized.startsWith('/') || normalized.startsWith('//')) return DEFAULT_POST_AUTH_PATH;
  if (normalized.startsWith('/api/')) return DEFAULT_POST_AUTH_PATH;
  if (normalized.includes('\\')) return DEFAULT_POST_AUTH_PATH;

  try {
    const parsed = new URL(normalized, 'https://atlas.local');
    if (parsed.origin !== 'https://atlas.local') {
      return DEFAULT_POST_AUTH_PATH;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_POST_AUTH_PATH;
  }
}
