export type ProEntitlementState = 'active' | 'revoked' | 'none';
export type ProEntitlementSource =
  | 'manual'
  | 'stripe'
  | 'ios_iap'
  | 'android_iap'
  | 'app_store'
  | 'play_store'
  | 'promo';

export type ProEntitlementSummary = {
  isPro: boolean;
  status: ProEntitlementState;
  source?: ProEntitlementSource;
  restoredAt?: Date | null;
  updatedAt?: Date;
};

type ProEntitlementRecord = {
  status: Exclude<ProEntitlementState, 'none'>;
  source: ProEntitlementSource;
  restoredAt: Date | null;
  updatedAt: Date;
};

type BillingProjectionRecord = {
  status: ProEntitlementState;
  provider: 'manual' | 'stripe' | 'ios_iap' | 'android_iap' | null;
  activeFrom: Date | null;
  updatedAt: Date;
};

type ProEntitlementClient = {
  billingEntitlementProjection?: {
    findUnique: (args: {
      where: { userId_productKey: { userId: string; productKey: string } };
      select: { status: true; provider: true; activeFrom: true; updatedAt: true };
    }) => Promise<BillingProjectionRecord | null>;
  };
  proEntitlement: {
    findUnique: (args: {
      where: { userId: string };
      select: { status: true; source: true; restoredAt: true; updatedAt: true };
    }) => Promise<ProEntitlementRecord | null>;
  };
};

type GetProEntitlementArgs = {
  prisma: ProEntitlementClient;
  userId: string;
};

function mapProjectionProviderToSource(
  provider: BillingProjectionRecord['provider'],
): ProEntitlementSource | undefined {
  if (provider === null) return undefined;
  if (provider === 'manual') return 'manual';
  if (provider === 'stripe') return 'stripe';
  if (provider === 'ios_iap') return 'ios_iap';
  return 'android_iap';
}

export async function getProEntitlementSummary({
  prisma,
  userId,
}: GetProEntitlementArgs): Promise<ProEntitlementSummary> {
  if (!userId) {
    return { isPro: false, status: 'none' };
  }

  const projection = await prisma.billingEntitlementProjection?.findUnique({
    where: { userId_productKey: { userId, productKey: 'pro_lifetime_v1' } },
    select: { status: true, provider: true, activeFrom: true, updatedAt: true },
  });
  if (projection) {
    return {
      isPro: projection.status === 'active',
      status: projection.status,
      source: mapProjectionProviderToSource(projection.provider),
      restoredAt: projection.activeFrom,
      updatedAt: projection.updatedAt,
    };
  }

  const record = await prisma.proEntitlement.findUnique({
    where: { userId },
    select: { status: true, source: true, restoredAt: true, updatedAt: true },
  });

  if (!record) {
    return { isPro: false, status: 'none' };
  }

  const isPro = record.status === 'active';
  return {
    isPro,
    status: record.status,
    source: record.source,
    restoredAt: record.restoredAt,
    updatedAt: record.updatedAt,
  };
}
