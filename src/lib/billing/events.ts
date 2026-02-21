import {
  BILLING_PRODUCT_KEYS,
  BILLING_PROVIDERS,
  type BillingPlanType,
  type BillingProductKey,
  type BillingProvider,
} from './types';

export const BILLING_EVENT_TYPES = [
  'purchase_initiated',
  'purchase_succeeded',
  'purchase_failed',
  'refund_issued',
  'chargeback_opened',
  'chargeback_won',
  'chargeback_lost',
  'entitlement_granted',
  'entitlement_revoked',
  'restore_requested',
  'restore_succeeded',
  'restore_failed',
] as const;

export type BillingEventType = (typeof BILLING_EVENT_TYPES)[number];

export const BILLING_RESTORE_ORIGINS = ['web', 'ios', 'android', 'support'] as const;

export type BillingRestoreOrigin = (typeof BILLING_RESTORE_ORIGINS)[number];

export type BillingEventPayloadMap = {
  purchase_initiated: {
    checkoutSessionId?: string;
    providerCustomerId?: string | null;
    amountCents?: number | null;
    currency?: string | null;
  };
  purchase_succeeded: {
    transactionId: string;
    amountCents: number;
    currency: string;
  };
  purchase_failed: {
    reasonCode: string;
    message?: string;
  };
  refund_issued: {
    transactionId: string;
    refundId: string;
    amountCents?: number | null;
    currency?: string | null;
  };
  chargeback_opened: {
    disputeId: string;
    transactionId?: string | null;
  };
  chargeback_won: {
    disputeId: string;
    transactionId?: string | null;
  };
  chargeback_lost: {
    disputeId: string;
    transactionId?: string | null;
  };
  entitlement_granted: {
    reason: 'purchase' | 'restore' | 'manual' | 'migration';
    effectiveAt: Date;
    periodStart?: Date | null;
    periodEnd?: Date | null;
    autoRenew?: boolean | null;
  };
  entitlement_revoked: {
    reason: 'refund' | 'chargeback' | 'admin' | 'fraud' | 'expiration';
    effectiveAt: Date;
  };
  restore_requested: {
    requestOrigin: BillingRestoreOrigin;
    requestedAt: Date;
  };
  restore_succeeded: {
    requestOrigin: BillingRestoreOrigin;
    restoredTransactionId?: string | null;
  };
  restore_failed: {
    requestOrigin: BillingRestoreOrigin;
    reasonCode: string;
  };
};

export type BillingEventPayload = BillingEventPayloadMap[BillingEventType];

type CanonicalBillingEventBase = {
  eventId: string;
  userId: string;
  provider: BillingProvider;
  productKey: BillingProductKey;
  planType?: BillingPlanType;
  occurredAt: Date;
  receivedAt: Date;
  providerEventId?: string | null;
  providerTransactionId?: string | null;
  idempotencyKey?: string | null;
  payloadHash?: string | null;
};

export type CanonicalBillingEvent = {
  [TType in BillingEventType]: CanonicalBillingEventBase & {
    type: TType;
    payload: BillingEventPayloadMap[TType];
  };
}[BillingEventType];

export type CanonicalBillingEventOfType<TType extends BillingEventType> = Extract<
  CanonicalBillingEvent,
  { type: TType }
>;

export function isBillingEventType(value: string): value is BillingEventType {
  return BILLING_EVENT_TYPES.includes(value as BillingEventType);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

export function getBillingEventPayloadError(
  type: BillingEventType,
  payload: unknown,
): string | null {
  if (!isRecord(payload)) {
    return 'Payload must be an object.';
  }

  switch (type) {
    case 'purchase_initiated':
      return null;
    case 'purchase_succeeded':
      if (!isNonEmptyString(payload.transactionId)) {
        return 'purchase_succeeded requires transactionId.';
      }
      if (!isNonNegativeInteger(payload.amountCents)) {
        return 'purchase_succeeded requires non-negative integer amountCents.';
      }
      if (!isNonEmptyString(payload.currency)) {
        return 'purchase_succeeded requires currency.';
      }
      return null;
    case 'purchase_failed':
      if (!isNonEmptyString(payload.reasonCode)) {
        return 'purchase_failed requires reasonCode.';
      }
      return null;
    case 'refund_issued':
      if (!isNonEmptyString(payload.transactionId)) {
        return 'refund_issued requires transactionId.';
      }
      if (!isNonEmptyString(payload.refundId)) {
        return 'refund_issued requires refundId.';
      }
      return null;
    case 'chargeback_opened':
    case 'chargeback_won':
    case 'chargeback_lost':
      if (!isNonEmptyString(payload.disputeId)) {
        return `${type} requires disputeId.`;
      }
      return null;
    case 'entitlement_granted':
      if (!isDate(payload.effectiveAt)) {
        return 'entitlement_granted requires effectiveAt Date.';
      }
      return null;
    case 'entitlement_revoked':
      if (!isDate(payload.effectiveAt)) {
        return 'entitlement_revoked requires effectiveAt Date.';
      }
      return null;
    case 'restore_requested':
      if (!BILLING_RESTORE_ORIGINS.includes(payload.requestOrigin as BillingRestoreOrigin)) {
        return 'restore_requested requires requestOrigin.';
      }
      if (!isDate(payload.requestedAt)) {
        return 'restore_requested requires requestedAt Date.';
      }
      return null;
    case 'restore_succeeded':
      if (!BILLING_RESTORE_ORIGINS.includes(payload.requestOrigin as BillingRestoreOrigin)) {
        return 'restore_succeeded requires requestOrigin.';
      }
      return null;
    case 'restore_failed':
      if (!BILLING_RESTORE_ORIGINS.includes(payload.requestOrigin as BillingRestoreOrigin)) {
        return 'restore_failed requires requestOrigin.';
      }
      if (!isNonEmptyString(payload.reasonCode)) {
        return 'restore_failed requires reasonCode.';
      }
      return null;
    default:
      return 'Unsupported billing event type.';
  }
}

export function getCanonicalBillingEventError(event: unknown): string | null {
  if (!isRecord(event)) {
    return 'Event must be an object.';
  }

  if (!isNonEmptyString(event.eventId)) {
    return 'Event requires eventId.';
  }
  if (!isNonEmptyString(event.userId)) {
    return 'Event requires userId.';
  }
  if (!BILLING_PROVIDERS.includes(event.provider as BillingProvider)) {
    return 'Event requires valid provider.';
  }
  if (!BILLING_PRODUCT_KEYS.includes(event.productKey as BillingProductKey)) {
    return 'Event requires valid productKey.';
  }
  if (!isDate(event.occurredAt)) {
    return 'Event requires occurredAt Date.';
  }
  if (!isDate(event.receivedAt)) {
    return 'Event requires receivedAt Date.';
  }
  if (!isNonEmptyString(event.type) || !isBillingEventType(event.type)) {
    return 'Event requires valid canonical type.';
  }

  return getBillingEventPayloadError(event.type, event.payload);
}
