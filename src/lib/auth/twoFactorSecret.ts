import crypto from 'node:crypto';

const ENCRYPTION_SCHEME_VERSION = 'v1';
const AES_256_KEY_BYTES = 32;
const GCM_IV_BYTES = 12;

function decodeKey(rawKey: string): Buffer {
  const trimmed = rawKey.trim();
  if (!trimmed) {
    throw new Error('TOTP encryption key is not configured.');
  }

  const normalized = trimmed.replace(/\s+/g, '');
  const decoded =
    /^[0-9a-fA-F]+$/.test(normalized) && normalized.length % 2 === 0
      ? Buffer.from(normalized, 'hex')
      : Buffer.from(normalized, 'base64');

  if (decoded.length !== AES_256_KEY_BYTES) {
    throw new Error('TOTP encryption key must decode to exactly 32 bytes.');
  }

  return decoded;
}

export function getTotpEncryptionKey(rawKey: string | undefined = process.env.TOTP_ENCRYPTION_KEY) {
  if (!rawKey) {
    throw new Error('TOTP encryption key is not configured.');
  }

  return decodeKey(rawKey);
}

export function encryptTwoFactorSecret(
  plaintextSecret: string,
  rawKey: string | undefined = process.env.TOTP_ENCRYPTION_KEY,
): string {
  const secret = plaintextSecret.trim();
  if (!secret) {
    throw new Error('Cannot encrypt an empty TOTP secret.');
  }

  const key = getTotpEncryptionKey(rawKey);
  const iv = crypto.randomBytes(GCM_IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTION_SCHEME_VERSION,
    iv.toString('base64url'),
    authTag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':');
}

export function decryptTwoFactorSecret(
  encryptedSecret: string,
  rawKey: string | undefined = process.env.TOTP_ENCRYPTION_KEY,
): string {
  const parts = encryptedSecret.split(':');
  if (parts.length !== 4 || parts[0] !== ENCRYPTION_SCHEME_VERSION) {
    throw new Error('Invalid encrypted TOTP secret format.');
  }

  const key = getTotpEncryptionKey(rawKey);
  const iv = Buffer.from(parts[1], 'base64url');
  const authTag = Buffer.from(parts[2], 'base64url');
  const ciphertext = Buffer.from(parts[3], 'base64url');

  if (iv.length !== GCM_IV_BYTES || authTag.length !== 16 || ciphertext.length < 1) {
    throw new Error('Invalid encrypted TOTP secret payload.');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  const decoded = plaintext.toString('utf8').trim();
  if (!decoded) {
    throw new Error('Invalid decrypted TOTP secret payload.');
  }

  return decoded;
}
