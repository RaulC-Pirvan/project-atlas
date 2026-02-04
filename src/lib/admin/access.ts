const ADMIN_OWNER_ENV = 'ADMIN_OWNER_EMAIL';
const ADMIN_ALLOWLIST_ENV = 'ADMIN_EMAIL_ALLOWLIST';

function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function parseAllowlist(value: string | null | undefined): string[] {
  if (!value) return [];

  return value
    .split(',')
    .map((entry) => normalizeEmail(entry))
    .filter((entry): entry is string => Boolean(entry));
}

export function getAdminAllowlist(): string[] {
  const allowlist = new Set<string>();
  const owner = normalizeEmail(process.env[ADMIN_OWNER_ENV]);

  if (owner) {
    allowlist.add(owner);
  }

  for (const entry of parseAllowlist(process.env[ADMIN_ALLOWLIST_ENV])) {
    allowlist.add(entry);
  }

  return Array.from(allowlist);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  const allowlist = getAdminAllowlist();
  if (allowlist.length === 0) return false;

  return allowlist.includes(normalized);
}

export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function isAdminApiPath(pathname: string): boolean {
  return pathname === '/api/admin' || pathname.startsWith('/api/admin/');
}
