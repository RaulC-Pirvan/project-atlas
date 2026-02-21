import type { CanonicalBillingEvent } from './events';
import {
  assertBillingProjectionInvariants,
  type BillingEntitlementProjection,
  createEmptyBillingEntitlementProjection,
} from './projection';

export function applyBillingEventToProjection(args: {
  current: BillingEntitlementProjection | null;
  event: CanonicalBillingEvent;
}): BillingEntitlementProjection {
  const base =
    args.current ??
    createEmptyBillingEntitlementProjection({
      userId: args.event.userId,
      productKey: args.event.productKey,
      updatedAt: args.event.receivedAt,
    });

  const next: BillingEntitlementProjection = {
    ...base,
    productKey: args.event.productKey,
    planType: args.event.planType ?? base.planType,
    lastEventId: args.event.eventId,
    lastEventType: args.event.type,
    updatedAt: args.event.receivedAt,
    version: base.version + 1,
  };

  if (next.planType === 'one_time') {
    next.periodStart = null;
    next.periodEnd = null;
    next.autoRenew = null;
  }

  switch (args.event.type) {
    case 'entitlement_granted':
      next.status = 'active';
      next.provider = args.event.provider;
      next.activeFrom = next.activeFrom ?? args.event.occurredAt;
      next.activeUntil = null;
      if (next.planType === 'subscription') {
        next.periodStart = args.event.payload.periodStart ?? null;
        next.periodEnd = args.event.payload.periodEnd ?? null;
        next.autoRenew = args.event.payload.autoRenew ?? false;
      }
      break;
    case 'purchase_succeeded':
    case 'restore_succeeded':
    case 'chargeback_won':
      next.status = 'active';
      next.provider = args.event.provider;
      next.activeFrom = next.activeFrom ?? args.event.occurredAt;
      next.activeUntil = null;
      break;
    case 'refund_issued':
    case 'chargeback_lost':
    case 'entitlement_revoked':
      next.status = 'revoked';
      next.provider = next.provider ?? args.event.provider;
      next.activeFrom = next.activeFrom ?? args.event.occurredAt;
      next.activeUntil = args.event.occurredAt;
      break;
    default:
      break;
  }

  assertBillingProjectionInvariants(next);
  return next;
}
