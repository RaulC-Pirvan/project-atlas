import type { BillingEventType } from './events';
import type {
  BillingEntitlementStatus,
  BillingPlanType,
  BillingProductKey,
  BillingProvider,
} from './types';

export type BillingEntitlementProjection = {
  userId: string;
  productKey: BillingProductKey;
  planType: BillingPlanType;
  status: BillingEntitlementStatus;
  provider: BillingProvider | null;
  providerCustomerId: string | null;
  providerAccountId: string | null;
  activeFrom: Date | null;
  activeUntil: Date | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  autoRenew: boolean | null;
  lastEventId: string | null;
  lastEventType: BillingEventType | null;
  updatedAt: Date;
  version: number;
};

export function createEmptyBillingEntitlementProjection(args: {
  userId: string;
  productKey?: BillingProductKey;
  updatedAt?: Date;
}): BillingEntitlementProjection {
  return {
    userId: args.userId,
    productKey: args.productKey ?? 'pro_lifetime_v1',
    planType: 'one_time',
    status: 'none',
    provider: null,
    providerCustomerId: null,
    providerAccountId: null,
    activeFrom: null,
    activeUntil: null,
    periodStart: null,
    periodEnd: null,
    autoRenew: null,
    lastEventId: null,
    lastEventType: null,
    updatedAt: args.updatedAt ?? new Date(),
    version: 0,
  };
}

export function isBillingEntitlementActive(projection: BillingEntitlementProjection): boolean {
  return projection.status === 'active';
}

export function getBillingProjectionInvariantErrors(
  projection: BillingEntitlementProjection,
): string[] {
  const errors: string[] = [];

  if (projection.userId.trim().length === 0) {
    errors.push('Projection requires userId.');
  }

  if (projection.status === 'none' && projection.provider !== null) {
    errors.push('status=none must not set provider.');
  }

  if (projection.status !== 'none' && projection.provider === null) {
    errors.push('status active/revoked requires provider.');
  }

  if (projection.status === 'active' && projection.activeFrom === null) {
    errors.push('status=active requires activeFrom.');
  }

  if (projection.status === 'active' && projection.activeUntil !== null) {
    errors.push('status=active must not set activeUntil.');
  }

  if (projection.planType === 'one_time') {
    if (
      projection.periodStart !== null ||
      projection.periodEnd !== null ||
      projection.autoRenew !== null
    ) {
      errors.push('planType=one_time must not set subscription period fields.');
    }
  }

  if (projection.planType === 'subscription') {
    if (projection.autoRenew === null) {
      errors.push('planType=subscription requires autoRenew.');
    }
    if (projection.periodStart !== null && projection.periodEnd !== null) {
      if (projection.periodEnd.getTime() < projection.periodStart.getTime()) {
        errors.push('subscription periodEnd must be >= periodStart.');
      }
    }
  }

  if (projection.version < 0 || !Number.isInteger(projection.version)) {
    errors.push('version must be a non-negative integer.');
  }

  return errors;
}

export function assertBillingProjectionInvariants(projection: BillingEntitlementProjection): void {
  const errors = getBillingProjectionInvariantErrors(projection);
  if (errors.length > 0) {
    throw new Error(`Invalid billing projection: ${errors.join(' ')}`);
  }
}
