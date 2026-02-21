import { describe, expect, it } from 'vitest';

import { getProEntitlementSummary } from '../entitlement';

describe('getProEntitlementSummary', () => {
  it('returns none when user id is missing', async () => {
    const prisma = {
      billingEntitlementProjection: {
        findUnique: async () => null,
      },
      proEntitlement: {
        findUnique: async () => null,
      },
    };

    const result = await getProEntitlementSummary({ prisma, userId: '' });

    expect(result).toEqual({ isPro: false, status: 'none' });
  });

  it('returns none when no entitlement exists', async () => {
    const prisma = {
      billingEntitlementProjection: {
        findUnique: async () => null,
      },
      proEntitlement: {
        findUnique: async () => null,
      },
    };

    const result = await getProEntitlementSummary({ prisma, userId: 'user-1' });

    expect(result).toEqual({ isPro: false, status: 'none' });
  });

  it('returns active entitlement details', async () => {
    const record = {
      status: 'active' as const,
      source: 'manual' as const,
      restoredAt: null,
      updatedAt: new Date('2026-02-04T00:00:00.000Z'),
    };

    const prisma = {
      billingEntitlementProjection: {
        findUnique: async () => null,
      },
      proEntitlement: {
        findUnique: async () => record,
      },
    };

    const result = await getProEntitlementSummary({ prisma, userId: 'user-1' });

    expect(result.isPro).toBe(true);
    expect(result.status).toBe('active');
    expect(result.source).toBe('manual');
  });

  it('returns revoked entitlement details', async () => {
    const record = {
      status: 'revoked' as const,
      source: 'promo' as const,
      restoredAt: new Date('2026-02-03T00:00:00.000Z'),
      updatedAt: new Date('2026-02-04T00:00:00.000Z'),
    };

    const prisma = {
      billingEntitlementProjection: {
        findUnique: async () => null,
      },
      proEntitlement: {
        findUnique: async () => record,
      },
    };

    const result = await getProEntitlementSummary({ prisma, userId: 'user-1' });

    expect(result.isPro).toBe(false);
    expect(result.status).toBe('revoked');
    expect(result.source).toBe('promo');
    expect(result.restoredAt?.toISOString()).toBe('2026-02-03T00:00:00.000Z');
  });

  it('prefers billing projection when available', async () => {
    const projection = {
      status: 'active' as const,
      provider: 'stripe' as const,
      activeFrom: new Date('2026-02-03T00:00:00.000Z'),
      updatedAt: new Date('2026-02-04T00:00:00.000Z'),
    };

    const prisma = {
      billingEntitlementProjection: {
        findUnique: async () => projection,
      },
      proEntitlement: {
        findUnique: async () => null,
      },
    };

    const result = await getProEntitlementSummary({ prisma, userId: 'user-1' });

    expect(result.isPro).toBe(true);
    expect(result.status).toBe('active');
    expect(result.source).toBe('stripe');
    expect(result.restoredAt?.toISOString()).toBe('2026-02-03T00:00:00.000Z');
  });
});
