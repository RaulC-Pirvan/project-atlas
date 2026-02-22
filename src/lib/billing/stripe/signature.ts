import crypto from 'node:crypto';

type VerifyStripeWebhookSignatureArgs = {
  payload: string;
  signatureHeader: string | null;
  secret: string;
  toleranceSeconds: number;
  nowMs?: number;
};

function parseStripeSignatureHeader(header: string): {
  timestamp: number;
  signatures: string[];
} | null {
  const parts = header.split(',').map((part) => part.trim());
  let timestamp: number | null = null;
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (!key || !value) continue;

    if (key === 't') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        timestamp = parsed;
      }
    }

    if (key === 'v1' && value.length > 0) {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    return null;
  }

  return { timestamp, signatures };
}

function secureCompareHex(a: string, b: string): boolean {
  try {
    const left = Buffer.from(a, 'hex');
    const right = Buffer.from(b, 'hex');
    if (left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export function verifyStripeWebhookSignature(args: VerifyStripeWebhookSignatureArgs): boolean {
  if (!args.signatureHeader) return false;

  const parsed = parseStripeSignatureHeader(args.signatureHeader);
  if (!parsed) return false;

  const nowSeconds = Math.floor((args.nowMs ?? Date.now()) / 1000);
  if (Math.abs(nowSeconds - parsed.timestamp) > args.toleranceSeconds) {
    return false;
  }

  const signedPayload = `${parsed.timestamp}.${args.payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', args.secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  return parsed.signatures.some((signature) => secureCompareHex(signature, expectedSignature));
}
