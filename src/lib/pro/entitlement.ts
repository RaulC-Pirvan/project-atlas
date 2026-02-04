export type ProEntitlementState = 'active' | 'revoked' | 'none';
export type ProEntitlementSource = 'manual' | 'app_store' | 'play_store' | 'promo';

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

type ProEntitlementClient = {
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

export async function getProEntitlementSummary({
  prisma,
  userId,
}: GetProEntitlementArgs): Promise<ProEntitlementSummary> {
  if (!userId) {
    return { isPro: false, status: 'none' };
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
