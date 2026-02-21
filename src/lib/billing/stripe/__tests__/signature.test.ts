import crypto from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { verifyStripeWebhookSignature } from '../signature';

function buildSignatureHeader(args: {
  payload: string;
  secret: string;
  timestamp: number;
}): string {
  const signedPayload = `${args.timestamp}.${args.payload}`;
  const signature = crypto
    .createHmac('sha256', args.secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  return `t=${args.timestamp},v1=${signature}`;
}

describe('stripe webhook signature verification', () => {
  it('accepts valid signature', () => {
    const payload = '{"id":"evt_1"}';
    const secret = 'whsec_test';
    const nowMs = Date.UTC(2026, 1, 21, 12, 0, 0);
    const timestamp = Math.floor(nowMs / 1000);
    const header = buildSignatureHeader({ payload, secret, timestamp });

    const isValid = verifyStripeWebhookSignature({
      payload,
      signatureHeader: header,
      secret,
      toleranceSeconds: 300,
      nowMs,
    });

    expect(isValid).toBe(true);
  });

  it('rejects signature outside tolerance window', () => {
    const payload = '{"id":"evt_1"}';
    const secret = 'whsec_test';
    const nowMs = Date.UTC(2026, 1, 21, 12, 0, 0);
    const oldTimestamp = Math.floor(nowMs / 1000) - 1000;
    const header = buildSignatureHeader({ payload, secret, timestamp: oldTimestamp });

    const isValid = verifyStripeWebhookSignature({
      payload,
      signatureHeader: header,
      secret,
      toleranceSeconds: 300,
      nowMs,
    });

    expect(isValid).toBe(false);
  });

  it('rejects invalid signature value', () => {
    const payload = '{"id":"evt_1"}';
    const secret = 'whsec_test';
    const nowMs = Date.UTC(2026, 1, 21, 12, 0, 0);
    const timestamp = Math.floor(nowMs / 1000);
    const header = `t=${timestamp},v1=not-a-valid-signature`;

    const isValid = verifyStripeWebhookSignature({
      payload,
      signatureHeader: header,
      secret,
      toleranceSeconds: 300,
      nowMs,
    });

    expect(isValid).toBe(false);
  });
});
