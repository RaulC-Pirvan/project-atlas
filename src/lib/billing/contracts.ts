import { BILLING_PROVIDERS, type BillingEntitlementStatus } from './types';

export const PRO_RESTORE_ROUTE = '/api/pro/restore' as const;
export const STRIPE_BILLING_PORTAL_ROUTE = '/api/billing/stripe/portal' as const;

export const PRO_RESTORE_OUTCOMES = ['restored', 'already_active', 'not_found'] as const;
export type ProRestoreOutcome = (typeof PRO_RESTORE_OUTCOMES)[number];

export const PRO_ENTITLEMENT_COMPAT_SOURCES = [
  ...BILLING_PROVIDERS,
  'app_store',
  'play_store',
  'promo',
] as const;
export type ProEntitlementCompatSource = (typeof PRO_ENTITLEMENT_COMPAT_SOURCES)[number];

export type ProRestoreRequest = {
  trigger: 'account';
};

export const DEFAULT_PRO_RESTORE_REQUEST: ProRestoreRequest = {
  trigger: 'account',
};

export type ProRestoreResponse = {
  outcome: ProRestoreOutcome;
  entitlement: {
    isPro: boolean;
    status: BillingEntitlementStatus;
    source: ProEntitlementCompatSource | null;
    updatedAt: string;
  };
};

export const ACCOUNT_BILLING_ACTION_IDS = ['manage_billing', 'restore_purchase'] as const;
export type AccountBillingActionId = (typeof ACCOUNT_BILLING_ACTION_IDS)[number];

export const ACCOUNT_BILLING_ACTIONS: Record<
  AccountBillingActionId,
  {
    label: string;
    href: string;
    method: 'GET' | 'POST';
    description: string;
  }
> = {
  manage_billing: {
    label: 'Manage billing / invoices',
    href: STRIPE_BILLING_PORTAL_ROUTE,
    method: 'GET',
    description: 'Open Stripe-hosted billing history and invoice access.',
  },
  restore_purchase: {
    label: 'Restore purchase',
    href: PRO_RESTORE_ROUTE,
    method: 'POST',
    description: 'Re-check completed purchases for this account and re-sync entitlement safely.',
  },
};

export const ACCOUNT_BILLING_COPY = {
  sectionTitle: 'Billing and restore',
  sectionDescription:
    'Manage invoices or re-sync a previously completed purchase for this account.',
  restoreHint:
    'Restore purchase only checks previously completed purchases tied to your signed-in account.',
} as const;

export function isProRestoreOutcome(value: string): value is ProRestoreOutcome {
  return PRO_RESTORE_OUTCOMES.includes(value as ProRestoreOutcome);
}

export function isAccountBillingActionId(value: string): value is AccountBillingActionId {
  return ACCOUNT_BILLING_ACTION_IDS.includes(value as AccountBillingActionId);
}
