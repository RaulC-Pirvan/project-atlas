import type { CanonicalBillingEvent } from '../events';
import { isBillingProductKey } from '../types';
import { isStripeSupportedWebhookEventType, STRIPE_WEBHOOK_CANONICAL_EVENT_MAP } from './contracts';

type StripeWebhookEvent = {
  id: string;
  type: string;
  created: number;
  data: {
    object: Record<string, unknown>;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function getNestedObjectId(value: unknown): string | null {
  if (typeof value === 'string') return asString(value);
  if (!isRecord(value)) return null;
  return asString(value.id);
}

function getMetadataValue(object: Record<string, unknown>, key: string): string | null {
  const metadata = object.metadata;
  if (!isRecord(metadata)) return null;
  return asString(metadata[key]);
}

function getCanonicalReferences(object: Record<string, unknown>): {
  userId: string;
  productKey: 'pro_lifetime_v1';
} | null {
  const userId = getMetadataValue(object, 'userId') ?? asString(object.client_reference_id);
  const productKeyValue = getMetadataValue(object, 'productKey') ?? 'pro_lifetime_v1';
  if (!userId || !isBillingProductKey(productKeyValue)) {
    return null;
  }

  return {
    userId,
    productKey: productKeyValue,
  };
}

function getCanonicalReferencesFromStripeObject(object: Record<string, unknown>): {
  userId: string;
  productKey: 'pro_lifetime_v1';
} | null {
  const directRefs = getCanonicalReferences(object);
  if (directRefs) {
    return directRefs;
  }

  const chargeObject = object.charge;
  if (isRecord(chargeObject)) {
    const chargeRefs = getCanonicalReferences(chargeObject);
    if (chargeRefs) {
      return chargeRefs;
    }
  }

  const paymentIntentObject = object.payment_intent;
  if (isRecord(paymentIntentObject)) {
    return getCanonicalReferences(paymentIntentObject);
  }

  return null;
}

function getStripeDisputeTransactionId(object: Record<string, unknown>): string | null {
  const chargeObject = object.charge;
  if (isRecord(chargeObject)) {
    const chargeId = asString(chargeObject.id);
    if (chargeId) return chargeId;
  }

  const paymentIntentObject = object.payment_intent;
  if (isRecord(paymentIntentObject)) {
    const paymentIntentId = asString(paymentIntentObject.id);
    if (paymentIntentId) return paymentIntentId;
  }

  return asString(object.charge) ?? asString(object.payment_intent);
}

function buildBaseEvent(args: {
  event: StripeWebhookEvent;
  canonicalType: CanonicalBillingEvent['type'];
  refs: { userId: string; productKey: 'pro_lifetime_v1' };
  payloadHash?: string | null;
  providerTransactionId?: string | null;
  receivedAt: Date;
}): Omit<CanonicalBillingEvent, 'payload' | 'type'> {
  return {
    eventId: `stripe:${args.event.id}:${args.canonicalType}`,
    userId: args.refs.userId,
    provider: 'stripe',
    productKey: args.refs.productKey,
    planType: 'one_time',
    occurredAt: new Date(args.event.created * 1000),
    receivedAt: args.receivedAt,
    providerEventId: args.event.id,
    providerTransactionId: args.providerTransactionId ?? null,
    idempotencyKey: null,
    payloadHash: args.payloadHash ?? null,
  };
}

export function parseStripeWebhookEvent(payload: string): StripeWebhookEvent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || !isRecord(parsed.data) || !isRecord(parsed.data.object)) {
    return null;
  }

  const id = asString(parsed.id);
  const type = asString(parsed.type);
  const created = asNumber(parsed.created);
  if (!id || !type || created === null) {
    return null;
  }

  return {
    id,
    type,
    created,
    data: {
      object: parsed.data.object,
    },
  };
}

export function normalizeStripeWebhookEventToCanonicalEvent(args: {
  event: StripeWebhookEvent;
  receivedAt?: Date;
  payloadHash?: string | null;
}): CanonicalBillingEvent | null {
  const receivedAt = args.receivedAt ?? new Date();
  const object = args.event.data.object;
  const refs = getCanonicalReferencesFromStripeObject(object);
  const providerEventType = args.event.type;

  if (!isStripeSupportedWebhookEventType(providerEventType)) {
    return null;
  }

  const canonicalType = STRIPE_WEBHOOK_CANONICAL_EVENT_MAP[providerEventType];

  switch (canonicalType) {
    case 'purchase_succeeded': {
      if (!refs) return null;
      const providerTransactionId =
        getNestedObjectId(object.payment_intent) ??
        asString(object.id) ??
        `checkout:${args.event.id}`;
      const amountCents = asNumber(object.amount_total) ?? 0;
      const currency = (asString(object.currency) ?? 'USD').toUpperCase();
      const providerCustomerId = getNestedObjectId(object.customer);
      return {
        ...buildBaseEvent({
          event: args.event,
          canonicalType: 'purchase_succeeded',
          refs,
          payloadHash: args.payloadHash,
          providerTransactionId,
          receivedAt,
        }),
        type: 'purchase_succeeded',
        payload: {
          transactionId: providerTransactionId,
          amountCents,
          currency,
          ...(providerCustomerId ? { providerCustomerId } : {}),
        },
      };
    }
    case 'purchase_failed': {
      if (!refs) return null;
      return {
        ...buildBaseEvent({
          event: args.event,
          canonicalType: 'purchase_failed',
          refs,
          payloadHash: args.payloadHash,
          providerTransactionId: getNestedObjectId(object.payment_intent),
          receivedAt,
        }),
        type: 'purchase_failed',
        payload: {
          reasonCode: providerEventType,
        },
      };
    }
    case 'refund_issued': {
      if (!refs) return null;
      const chargeId = asString(object.id);
      if (!chargeId) return null;
      const refundId = `refund:${args.event.id}`;
      return {
        ...buildBaseEvent({
          event: args.event,
          canonicalType: 'refund_issued',
          refs,
          payloadHash: args.payloadHash,
          providerTransactionId: chargeId,
          receivedAt,
        }),
        type: 'refund_issued',
        payload: {
          transactionId: chargeId,
          refundId,
          amountCents: asNumber(object.amount_refunded),
          currency: (asString(object.currency) ?? 'USD').toUpperCase(),
        },
      };
    }
    case 'chargeback_opened': {
      if (!refs) return null;
      const disputeId = asString(object.id);
      if (!disputeId) return null;
      const transactionId = getStripeDisputeTransactionId(object);
      return {
        ...buildBaseEvent({
          event: args.event,
          canonicalType: 'chargeback_opened',
          refs,
          payloadHash: args.payloadHash,
          providerTransactionId: transactionId,
          receivedAt,
        }),
        type: 'chargeback_opened',
        payload: {
          disputeId,
          transactionId,
        },
      };
    }
    case 'chargeback_won':
    case 'chargeback_lost': {
      if (!refs) return null;
      const disputeId = asString(object.id);
      if (!disputeId) return null;

      const disputeStatus = asString(object.status);
      let resolvedType: 'chargeback_won' | 'chargeback_lost' | null = null;
      if (disputeStatus === 'won') {
        resolvedType = 'chargeback_won';
      } else if (disputeStatus === 'lost') {
        resolvedType = 'chargeback_lost';
      }

      if (!resolvedType) return null;

      const transactionId = getStripeDisputeTransactionId(object);
      return {
        ...buildBaseEvent({
          event: args.event,
          canonicalType: resolvedType,
          refs,
          payloadHash: args.payloadHash,
          providerTransactionId: transactionId,
          receivedAt,
        }),
        type: resolvedType,
        payload: {
          disputeId,
          transactionId,
        },
      };
    }
  }
}
