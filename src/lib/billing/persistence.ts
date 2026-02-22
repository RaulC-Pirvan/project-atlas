import type { BillingEventType, CanonicalBillingEvent } from './events';
import { normalizeBillingIdempotencyKey } from './idempotency';
import type { BillingEntitlementProjection } from './projection';
import { createEmptyBillingEntitlementProjection } from './projection';
import { applyBillingEventToProjection } from './projector';
import type { BillingPlanType, BillingProvider } from './types';

export type BillingEventLedgerRecord = {
  id: string;
  eventId: string;
  userId: string;
  provider: BillingProvider;
  providerEventId: string | null;
  providerTransactionId: string | null;
  idempotencyKey: string | null;
  productKey: string;
  planType: BillingPlanType;
  eventType: BillingEventType;
  occurredAt: Date;
  receivedAt: Date;
  payload: unknown;
  payloadHash: string | null;
  signatureVerified: boolean | null;
  createdAt: Date;
};

export type BillingEntitlementProjectionRecord = {
  id: string;
  userId: string;
  productKey: string;
  planType: BillingPlanType;
  status: 'none' | 'active' | 'revoked';
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
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

type BillingEventLedgerDelegate = {
  findUnique: (args: {
    where:
      | { eventId: string }
      | { idempotencyKey: string }
      | { provider_providerEventId: { provider: BillingProvider; providerEventId: string } };
  }) => Promise<BillingEventLedgerRecord | null>;
  create: (args: {
    data: {
      eventId: string;
      userId: string;
      provider: BillingProvider;
      providerEventId?: string | null;
      providerTransactionId?: string | null;
      idempotencyKey?: string | null;
      productKey: string;
      planType: BillingPlanType;
      eventType: BillingEventType;
      occurredAt: Date;
      receivedAt: Date;
      payload: unknown;
      payloadHash?: string | null;
      signatureVerified?: boolean | null;
    };
  }) => Promise<BillingEventLedgerRecord>;
};

type BillingEntitlementProjectionDelegate = {
  findUnique: (args: {
    where: {
      userId_productKey: {
        userId: string;
        productKey: string;
      };
    };
  }) => Promise<BillingEntitlementProjectionRecord | null>;
  upsert: (args: {
    where: {
      userId_productKey: {
        userId: string;
        productKey: string;
      };
    };
    create: {
      userId: string;
      productKey: string;
      planType: BillingPlanType;
      status: 'none' | 'active' | 'revoked';
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
      version: number;
      updatedAt: Date;
    };
    update: {
      planType: BillingPlanType;
      status: 'none' | 'active' | 'revoked';
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
      version: number;
      updatedAt: Date;
    };
  }) => Promise<BillingEntitlementProjectionRecord>;
};

export type BillingPersistenceTx = {
  billingEventLedger: BillingEventLedgerDelegate;
  billingEntitlementProjection: BillingEntitlementProjectionDelegate;
};

export type BillingPersistenceClient = BillingPersistenceTx & {
  $transaction: <T>(fn: (tx: BillingPersistenceTx) => Promise<T>) => Promise<T>;
};

export type BillingProjectionDedupeReason = 'event_id' | 'provider_event_id' | 'idempotency_key';

export type AppendAndProjectResult = {
  appended: boolean;
  dedupeReason: BillingProjectionDedupeReason | null;
  ledgerEvent: BillingEventLedgerRecord;
  projection: BillingEntitlementProjection;
};

function trimNullable(value?: string | null): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length === 0 ? null : normalized;
}

function toProjectionDomain(
  record: BillingEntitlementProjectionRecord | null,
  fallback: { userId: string; productKey: string },
): BillingEntitlementProjection {
  if (!record) {
    return createEmptyBillingEntitlementProjection({
      userId: fallback.userId,
      productKey: fallback.productKey as 'pro_lifetime_v1',
    });
  }

  return {
    userId: record.userId,
    productKey: record.productKey as 'pro_lifetime_v1',
    planType: record.planType,
    status: record.status,
    provider: record.provider,
    providerCustomerId: record.providerCustomerId,
    providerAccountId: record.providerAccountId,
    activeFrom: record.activeFrom,
    activeUntil: record.activeUntil,
    periodStart: record.periodStart,
    periodEnd: record.periodEnd,
    autoRenew: record.autoRenew,
    lastEventId: record.lastEventId,
    lastEventType: record.lastEventType,
    updatedAt: record.updatedAt,
    version: record.version,
  };
}

async function findDuplicateEvent(
  tx: BillingPersistenceTx,
  event: CanonicalBillingEvent,
): Promise<{ record: BillingEventLedgerRecord; reason: BillingProjectionDedupeReason } | null> {
  const duplicateByEventId = await tx.billingEventLedger.findUnique({
    where: { eventId: event.eventId },
  });
  if (duplicateByEventId) {
    return { record: duplicateByEventId, reason: 'event_id' };
  }

  const providerEventId = trimNullable(event.providerEventId);
  if (providerEventId) {
    const duplicateByProviderEvent = await tx.billingEventLedger.findUnique({
      where: {
        provider_providerEventId: {
          provider: event.provider,
          providerEventId,
        },
      },
    });
    if (duplicateByProviderEvent) {
      return { record: duplicateByProviderEvent, reason: 'provider_event_id' };
    }
  }

  const idempotencyKey = trimNullable(event.idempotencyKey);
  if (idempotencyKey) {
    const duplicateByIdempotency = await tx.billingEventLedger.findUnique({
      where: { idempotencyKey: normalizeBillingIdempotencyKey(idempotencyKey) },
    });
    if (duplicateByIdempotency) {
      return { record: duplicateByIdempotency, reason: 'idempotency_key' };
    }
  }

  return null;
}

function toProjectionUpsertData(projection: BillingEntitlementProjection): {
  planType: BillingPlanType;
  status: 'none' | 'active' | 'revoked';
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
  version: number;
  updatedAt: Date;
} {
  return {
    planType: projection.planType,
    status: projection.status,
    provider: projection.provider,
    providerCustomerId: projection.providerCustomerId,
    providerAccountId: projection.providerAccountId,
    activeFrom: projection.activeFrom,
    activeUntil: projection.activeUntil,
    periodStart: projection.periodStart,
    periodEnd: projection.periodEnd,
    autoRenew: projection.autoRenew,
    lastEventId: projection.lastEventId,
    lastEventType: projection.lastEventType,
    version: projection.version,
    updatedAt: projection.updatedAt,
  };
}

export async function appendBillingEventAndProject(args: {
  prisma: BillingPersistenceClient;
  event: CanonicalBillingEvent;
  signatureVerified?: boolean | null;
}): Promise<AppendAndProjectResult> {
  return args.prisma.$transaction(async (tx) => {
    const duplicate = await findDuplicateEvent(tx, args.event);
    if (duplicate) {
      const existingProjection = await tx.billingEntitlementProjection.findUnique({
        where: {
          userId_productKey: {
            userId: args.event.userId,
            productKey: args.event.productKey,
          },
        },
      });

      return {
        appended: false,
        dedupeReason: duplicate.reason,
        ledgerEvent: duplicate.record,
        projection: toProjectionDomain(existingProjection, {
          userId: args.event.userId,
          productKey: args.event.productKey,
        }),
      };
    }

    const createdEvent = await tx.billingEventLedger.create({
      data: {
        eventId: args.event.eventId,
        userId: args.event.userId,
        provider: args.event.provider,
        providerEventId: trimNullable(args.event.providerEventId),
        providerTransactionId: trimNullable(args.event.providerTransactionId),
        idempotencyKey: args.event.idempotencyKey
          ? normalizeBillingIdempotencyKey(args.event.idempotencyKey)
          : null,
        productKey: args.event.productKey,
        planType: args.event.planType ?? 'one_time',
        eventType: args.event.type,
        occurredAt: args.event.occurredAt,
        receivedAt: args.event.receivedAt,
        payload: args.event.payload,
        payloadHash: trimNullable(args.event.payloadHash),
        signatureVerified: args.signatureVerified ?? null,
      },
    });

    const existingProjection = await tx.billingEntitlementProjection.findUnique({
      where: {
        userId_productKey: {
          userId: args.event.userId,
          productKey: args.event.productKey,
        },
      },
    });

    const nextProjection = applyBillingEventToProjection({
      current: toProjectionDomain(existingProjection, {
        userId: args.event.userId,
        productKey: args.event.productKey,
      }),
      event: args.event,
    });

    const projectionData = toProjectionUpsertData(nextProjection);
    const savedProjection = await tx.billingEntitlementProjection.upsert({
      where: {
        userId_productKey: {
          userId: nextProjection.userId,
          productKey: nextProjection.productKey,
        },
      },
      create: {
        userId: nextProjection.userId,
        productKey: nextProjection.productKey,
        ...projectionData,
      },
      update: projectionData,
    });

    return {
      appended: true,
      dedupeReason: null,
      ledgerEvent: createdEvent,
      projection: toProjectionDomain(savedProjection, {
        userId: args.event.userId,
        productKey: args.event.productKey,
      }),
    };
  });
}
