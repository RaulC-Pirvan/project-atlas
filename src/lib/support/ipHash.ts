import crypto from 'node:crypto';

const DEV_FALLBACK_HASH_SECRET = 'atlas-support-dev-ip-hash-secret';

type HashOptions = {
  secret?: string;
};

function resolveHashSecret(secret?: string): string {
  const configured = secret ?? process.env.SUPPORT_IP_HASH_SECRET;
  if (configured && configured.trim().length > 0) {
    return configured.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SUPPORT_IP_HASH_SECRET is required in production.');
  }

  return DEV_FALLBACK_HASH_SECRET;
}

function hashValue(rawValue: string, secret?: string): string {
  return crypto.createHmac('sha256', resolveHashSecret(secret)).update(rawValue).digest('hex');
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePrincipal(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : 'unknown';
}

export function hashSupportIpAddress(ipAddress: string, options: HashOptions = {}): string {
  return hashValue(normalizePrincipal(ipAddress), options.secret);
}

export function hashSupportEmailAddress(email: string, options: HashOptions = {}): string {
  return hashValue(normalizeEmail(email), options.secret);
}
