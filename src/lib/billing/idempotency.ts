import type { BillingProvider } from './types';

export const BILLING_IDEMPOTENCY_KEY_MIN_LENGTH = 8;
export const BILLING_IDEMPOTENCY_KEY_MAX_LENGTH = 128;

const BILLING_IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:_-]*$/;

export function normalizeBillingIdempotencyKey(key: string): string {
  return key.trim().toLowerCase();
}

export function isValidBillingIdempotencyKey(key: string): boolean {
  const normalized = normalizeBillingIdempotencyKey(key);
  return (
    normalized.length >= BILLING_IDEMPOTENCY_KEY_MIN_LENGTH &&
    normalized.length <= BILLING_IDEMPOTENCY_KEY_MAX_LENGTH &&
    BILLING_IDEMPOTENCY_KEY_PATTERN.test(normalized)
  );
}

export function assertValidBillingIdempotencyKey(key: string): void {
  if (!isValidBillingIdempotencyKey(key)) {
    throw new Error(
      `Invalid idempotency key. Expected ${BILLING_IDEMPOTENCY_KEY_MIN_LENGTH}-${BILLING_IDEMPOTENCY_KEY_MAX_LENGTH} chars and [A-Za-z0-9:_-].`,
    );
  }
}

export function buildBillingCommandDedupeKey(idempotencyKey: string): string {
  assertValidBillingIdempotencyKey(idempotencyKey);
  return normalizeBillingIdempotencyKey(idempotencyKey);
}

export function buildBillingWebhookDedupeKey(args: {
  provider: BillingProvider;
  providerEventId: string;
}): string {
  const providerEventId = args.providerEventId.trim();
  if (providerEventId.length === 0) {
    throw new Error('providerEventId is required for webhook dedupe.');
  }

  return `${args.provider}:${providerEventId}`;
}
