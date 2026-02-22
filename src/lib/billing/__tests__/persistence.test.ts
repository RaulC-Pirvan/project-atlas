import { describe, expect, it } from 'vitest';

import type { CanonicalBillingEventOfType } from '../events';
import type { BillingPersistenceClient } from '../persistence';
import { appendBillingEventAndProject } from '../persistence';

type InMemoryEventRow = {
  id: string;
  eventId: string;
  userId: string;
  provider: 'manual' | 'stripe' | 'ios_iap' | 'android_iap';
  providerEventId: string | null;
  providerTransactionId: string | null;
  idempotencyKey: string | null;
  productKey: string;
  planType: 'one_time' | 'subscription';
  eventType:
    | 'purchase_initiated'
    | 'purchase_succeeded'
    | 'purchase_failed'
    | 'refund_issued'
    | 'chargeback_opened'
    | 'chargeback_won'
    | 'chargeback_lost'
    | 'entitlement_granted'
    | 'entitlement_revoked'
    | 'restore_requested'
    | 'restore_succeeded'
    | 'restore_failed';
  occurredAt: Date;
  receivedAt: Date;
  payload: unknown;
  payloadHash: string | null;
  signatureVerified: boolean | null;
  createdAt: Date;
};

type InMemoryProjectionRow = {
  id: string;
  userId: string;
  productKey: string;
  planType: 'one_time' | 'subscription';
  status: 'none' | 'active' | 'revoked';
  provider: 'manual' | 'stripe' | 'ios_iap' | 'android_iap' | null;
  providerCustomerId: string | null;
  providerAccountId: string | null;
  activeFrom: Date | null;
  activeUntil: Date | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  autoRenew: boolean | null;
  lastEventId: string | null;
  lastEventType: InMemoryEventRow['eventType'] | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

function createInMemoryBillingClient() {
  const events: InMemoryEventRow[] = [];
  const projections: InMemoryProjectionRow[] = [];
  let eventSeq = 1;
  let projectionSeq = 1;

  const tx = {
    billingEventLedger: {
      findUnique: async ({
        where,
      }: {
        where:
          | { eventId: string }
          | { idempotencyKey: string }
          | {
              provider_providerEventId: {
                provider: InMemoryEventRow['provider'];
                providerEventId: string;
              };
            };
      }) => {
        if ('eventId' in where) {
          return events.find((row) => row.eventId === where.eventId) ?? null;
        }
        if ('idempotencyKey' in where) {
          return events.find((row) => row.idempotencyKey === where.idempotencyKey) ?? null;
        }

        const { provider, providerEventId } = where.provider_providerEventId;
        return (
          events.find(
            (row) => row.provider === provider && row.providerEventId === providerEventId,
          ) ?? null
        );
      },
      create: async ({
        data,
      }: {
        data: {
          eventId: string;
          userId: string;
          provider: InMemoryEventRow['provider'];
          providerEventId?: string | null;
          providerTransactionId?: string | null;
          idempotencyKey?: string | null;
          productKey: string;
          planType: InMemoryEventRow['planType'];
          eventType: InMemoryEventRow['eventType'];
          occurredAt: Date;
          receivedAt: Date;
          payload: unknown;
          payloadHash?: string | null;
          signatureVerified?: boolean | null;
        };
      }) => {
        const row: InMemoryEventRow = {
          id: `event-row-${eventSeq++}`,
          eventId: data.eventId,
          userId: data.userId,
          provider: data.provider,
          providerEventId: data.providerEventId ?? null,
          providerTransactionId: data.providerTransactionId ?? null,
          idempotencyKey: data.idempotencyKey ?? null,
          productKey: data.productKey,
          planType: data.planType,
          eventType: data.eventType,
          occurredAt: data.occurredAt,
          receivedAt: data.receivedAt,
          payload: data.payload,
          payloadHash: data.payloadHash ?? null,
          signatureVerified: data.signatureVerified ?? null,
          createdAt: new Date('2026-02-21T12:00:00.000Z'),
        };
        events.push(row);
        return row;
      },
    },
    billingEntitlementProjection: {
      findUnique: async ({
        where,
      }: {
        where: { userId_productKey: { userId: string; productKey: string } };
      }) => {
        return (
          projections.find(
            (row) =>
              row.userId === where.userId_productKey.userId &&
              row.productKey === where.userId_productKey.productKey,
          ) ?? null
        );
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { userId_productKey: { userId: string; productKey: string } };
        create: Omit<InMemoryProjectionRow, 'id' | 'createdAt'>;
        update: Omit<InMemoryProjectionRow, 'id' | 'createdAt' | 'userId' | 'productKey'>;
      }) => {
        const idx = projections.findIndex(
          (row) =>
            row.userId === where.userId_productKey.userId &&
            row.productKey === where.userId_productKey.productKey,
        );

        if (idx === -1) {
          const created: InMemoryProjectionRow = {
            id: `projection-row-${projectionSeq++}`,
            createdAt: new Date('2026-02-21T12:00:00.000Z'),
            ...create,
          };
          projections.push(created);
          return created;
        }

        const existing = projections[idx];
        const updated: InMemoryProjectionRow = {
          ...existing,
          ...update,
        };
        projections[idx] = updated;
        return updated;
      },
    },
  };

  return {
    events,
    projections,
    prisma: {
      ...tx,
      $transaction: async <T>(fn: (innerTx: typeof tx) => Promise<T>) => fn(tx),
    } satisfies BillingPersistenceClient,
  };
}

function createPurchaseEvent(args: {
  eventId: string;
  providerEventId?: string | null;
  idempotencyKey?: string | null;
  occurredAt?: string;
}): CanonicalBillingEventOfType<'purchase_succeeded'> {
  const timestamp = args.occurredAt ?? '2026-02-21T09:00:00.000Z';
  return {
    eventId: args.eventId,
    type: 'purchase_succeeded',
    userId: 'user-1',
    provider: 'stripe',
    productKey: 'pro_lifetime_v1',
    occurredAt: new Date(timestamp),
    receivedAt: new Date('2026-02-21T09:00:10.000Z'),
    providerEventId: args.providerEventId ?? null,
    providerTransactionId: 'txn_123',
    idempotencyKey: args.idempotencyKey ?? null,
    payloadHash: 'sha256:abc123',
    payload: {
      transactionId: 'txn_123',
      amountCents: 1999,
      currency: 'USD',
    },
  };
}

describe('billing persistence helpers', () => {
  it('appends event and projects active one-time entitlement', async () => {
    const store = createInMemoryBillingClient();
    const result = await appendBillingEventAndProject({
      prisma: store.prisma,
      event: createPurchaseEvent({
        eventId: 'evt-canon-1',
        providerEventId: 'evt_provider_1',
      }),
    });

    expect(result.appended).toBe(true);
    expect(result.dedupeReason).toBeNull();
    expect(result.projection.status).toBe('active');
    expect(result.projection.planType).toBe('one_time');
    expect(result.projection.provider).toBe('stripe');
    expect(result.projection.version).toBe(1);
    expect(store.events).toHaveLength(1);
    expect(store.projections).toHaveLength(1);
  });

  it('dedupes on provider event id and keeps projection replay-safe', async () => {
    const store = createInMemoryBillingClient();

    await appendBillingEventAndProject({
      prisma: store.prisma,
      event: createPurchaseEvent({
        eventId: 'evt-canon-1',
        providerEventId: 'evt_provider_1',
      }),
    });

    const duplicate = await appendBillingEventAndProject({
      prisma: store.prisma,
      event: createPurchaseEvent({
        eventId: 'evt-canon-2',
        providerEventId: 'evt_provider_1',
      }),
    });

    expect(duplicate.appended).toBe(false);
    expect(duplicate.dedupeReason).toBe('provider_event_id');
    expect(duplicate.projection.version).toBe(1);
    expect(store.events).toHaveLength(1);
    expect(store.projections[0]?.lastEventId).toBe('evt-canon-1');
  });

  it('dedupes on idempotency key after normalization', async () => {
    const store = createInMemoryBillingClient();

    await appendBillingEventAndProject({
      prisma: store.prisma,
      event: createPurchaseEvent({
        eventId: 'evt-canon-1',
        idempotencyKey: 'Checkout:User-1:Attempt-1',
      }),
    });

    const duplicate = await appendBillingEventAndProject({
      prisma: store.prisma,
      event: createPurchaseEvent({
        eventId: 'evt-canon-2',
        idempotencyKey: ' checkout:user-1:attempt-1 ',
      }),
    });

    expect(duplicate.appended).toBe(false);
    expect(duplicate.dedupeReason).toBe('idempotency_key');
    expect(store.events).toHaveLength(1);
  });

  it('dedupes on canonical event id for replay safety', async () => {
    const store = createInMemoryBillingClient();
    const event = createPurchaseEvent({
      eventId: 'evt-canon-1',
      providerEventId: 'evt_provider_1',
    });

    await appendBillingEventAndProject({ prisma: store.prisma, event });
    const duplicate = await appendBillingEventAndProject({ prisma: store.prisma, event });

    expect(duplicate.appended).toBe(false);
    expect(duplicate.dedupeReason).toBe('event_id');
    expect(duplicate.projection.version).toBe(1);
    expect(store.events).toHaveLength(1);
  });
});
