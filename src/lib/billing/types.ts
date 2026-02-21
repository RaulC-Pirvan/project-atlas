export const BILLING_PROVIDERS = ['manual', 'stripe', 'ios_iap', 'android_iap'] as const;

export type BillingProvider = (typeof BILLING_PROVIDERS)[number];

export const BILLING_PRODUCT_KEYS = ['pro_lifetime_v1'] as const;

export type BillingProductKey = (typeof BILLING_PRODUCT_KEYS)[number];

export const BILLING_PLAN_TYPES = ['one_time', 'subscription'] as const;

export type BillingPlanType = (typeof BILLING_PLAN_TYPES)[number];

export const BILLING_ENTITLEMENT_STATUSES = ['none', 'active', 'revoked'] as const;

export type BillingEntitlementStatus = (typeof BILLING_ENTITLEMENT_STATUSES)[number];

export type ProviderProductMapping = {
  provider: BillingProvider;
  providerProductId: string;
  productKey: BillingProductKey;
  planType: BillingPlanType;
  active: boolean;
};

export type BillingProviderAccountRef = {
  providerCustomerId?: string | null;
  providerAccountId?: string | null;
};

export function isBillingProvider(value: string): value is BillingProvider {
  return BILLING_PROVIDERS.includes(value as BillingProvider);
}

export function isBillingProductKey(value: string): value is BillingProductKey {
  return BILLING_PRODUCT_KEYS.includes(value as BillingProductKey);
}

export function isBillingPlanType(value: string): value is BillingPlanType {
  return BILLING_PLAN_TYPES.includes(value as BillingPlanType);
}

export function isBillingEntitlementStatus(value: string): value is BillingEntitlementStatus {
  return BILLING_ENTITLEMENT_STATUSES.includes(value as BillingEntitlementStatus);
}
