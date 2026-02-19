import crypto from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const BASE32_LOOKUP = new Map(BASE32_ALPHABET.split('').map((char, index) => [char, index]));

export type TotpAlgorithm = 'sha1' | 'sha256' | 'sha512';

type TotpCoreOptions = {
  digits?: number;
  periodSeconds?: number;
  algorithm?: TotpAlgorithm;
};

export type GenerateTotpCodeOptions = TotpCoreOptions & {
  timestampMs?: number;
  counterOffset?: number;
};

export type VerifyTotpCodeOptions = TotpCoreOptions & {
  timestampMs?: number;
  skewSteps?: number;
};

type BuildTotpUriOptions = TotpCoreOptions & {
  secret: string;
  accountName: string;
  issuer: string;
};

const DEFAULT_DIGITS = 6;
const DEFAULT_PERIOD_SECONDS = 30;
const DEFAULT_ALGORITHM: TotpAlgorithm = 'sha1';
const DEFAULT_SKEW_STEPS = 1;

function normalizeDigits(digits: number | undefined): number {
  const normalized = digits ?? DEFAULT_DIGITS;
  if (!Number.isInteger(normalized) || normalized < 6 || normalized > 10) {
    throw new Error('Invalid TOTP digit count.');
  }

  return normalized;
}

function normalizePeriodSeconds(periodSeconds: number | undefined): number {
  const normalized = periodSeconds ?? DEFAULT_PERIOD_SECONDS;
  if (!Number.isInteger(normalized) || normalized < 1 || normalized > 300) {
    throw new Error('Invalid TOTP period.');
  }

  return normalized;
}

function normalizeAlgorithm(algorithm: TotpAlgorithm | undefined): TotpAlgorithm {
  return algorithm ?? DEFAULT_ALGORITHM;
}

function normalizeTimestampMs(timestampMs: number | undefined): number {
  const normalized = timestampMs ?? Date.now();
  if (!Number.isFinite(normalized) || normalized < 0) {
    throw new Error('Invalid timestamp.');
  }

  return normalized;
}

function normalizeCounterOffset(counterOffset: number | undefined): number {
  const normalized = counterOffset ?? 0;
  if (!Number.isInteger(normalized)) {
    throw new Error('Invalid counter offset.');
  }

  return normalized;
}

function normalizeSkewSteps(skewSteps: number | undefined): number {
  const normalized = skewSteps ?? DEFAULT_SKEW_STEPS;
  if (!Number.isInteger(normalized) || normalized < 0 || normalized > 10) {
    throw new Error('Invalid skew window.');
  }

  return normalized;
}

function toCounterBuffer(counter: number): Buffer {
  if (!Number.isInteger(counter) || counter < 0) {
    throw new Error('Invalid TOTP counter.');
  }

  const buffer = Buffer.alloc(8);
  const high = Math.floor(counter / 0x1_0000_0000);
  const low = counter >>> 0;
  buffer.writeUInt32BE(high >>> 0, 0);
  buffer.writeUInt32BE(low, 4);

  return buffer;
}

function base32Encode(bytes: Uint8Array): string {
  let output = '';
  let bits = 0;
  let value = 0;

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(input: string): Buffer {
  const sanitized = input.trim().replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase();
  if (!sanitized) {
    throw new Error('TOTP secret is required.');
  }

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of sanitized) {
    const chunk = BASE32_LOOKUP.get(char);
    if (chunk === undefined) {
      throw new Error('Invalid TOTP secret encoding.');
    }

    value = (value << 5) | chunk;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function computeHotpCode(
  secret: string,
  counter: number,
  algorithm: TotpAlgorithm,
  digits: number,
): string {
  const secretBuffer = base32Decode(secret);
  const counterBuffer = toCounterBuffer(counter);
  const digest = crypto.createHmac(algorithm, secretBuffer).update(counterBuffer).digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const divisor = 10 ** digits;
  const code = binary % divisor;
  return code.toString().padStart(digits, '0');
}

function safeCodeCompare(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export function normalizeTotpCode(code: string): string {
  return code.trim().replace(/\s+/g, '');
}

export function generateTotpSecret(byteLength: number = 20): string {
  if (!Number.isInteger(byteLength) || byteLength < 10 || byteLength > 128) {
    throw new Error('Invalid TOTP secret length.');
  }

  return base32Encode(crypto.randomBytes(byteLength));
}

export function buildTotpOtpauthUri(options: BuildTotpUriOptions): string {
  const issuer = options.issuer.trim();
  const accountName = options.accountName.trim();
  const digits = normalizeDigits(options.digits);
  const periodSeconds = normalizePeriodSeconds(options.periodSeconds);
  const algorithm = normalizeAlgorithm(options.algorithm);

  if (!issuer) {
    throw new Error('Issuer is required.');
  }

  if (!accountName) {
    throw new Error('Account name is required.');
  }

  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret: options.secret,
    issuer,
    algorithm: algorithm.toUpperCase(),
    digits: String(digits),
    period: String(periodSeconds),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}

export function generateTotpCode(secret: string, options: GenerateTotpCodeOptions = {}): string {
  const digits = normalizeDigits(options.digits);
  const periodSeconds = normalizePeriodSeconds(options.periodSeconds);
  const algorithm = normalizeAlgorithm(options.algorithm);
  const timestampMs = normalizeTimestampMs(options.timestampMs);
  const counterOffset = normalizeCounterOffset(options.counterOffset);
  const counter = Math.floor(timestampMs / 1000 / periodSeconds) + counterOffset;

  return computeHotpCode(secret, counter, algorithm, digits);
}

export function verifyTotpCode(
  secret: string,
  code: string,
  options: VerifyTotpCodeOptions = {},
): { valid: boolean; stepOffset: number | null } {
  const digits = normalizeDigits(options.digits);
  const periodSeconds = normalizePeriodSeconds(options.periodSeconds);
  const algorithm = normalizeAlgorithm(options.algorithm);
  const timestampMs = normalizeTimestampMs(options.timestampMs);
  const skewSteps = normalizeSkewSteps(options.skewSteps);
  const normalizedCode = normalizeTotpCode(code);

  if (!/^\d+$/.test(normalizedCode) || normalizedCode.length !== digits) {
    return { valid: false, stepOffset: null };
  }

  const baseCounter = Math.floor(timestampMs / 1000 / periodSeconds);
  for (let offset = -skewSteps; offset <= skewSteps; offset += 1) {
    const counter = baseCounter + offset;
    if (counter < 0) {
      continue;
    }

    const expected = computeHotpCode(secret, counter, algorithm, digits);
    if (safeCodeCompare(expected, normalizedCode)) {
      return { valid: true, stepOffset: offset };
    }
  }

  return { valid: false, stepOffset: null };
}
