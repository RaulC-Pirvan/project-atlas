import { describe, expect, it } from 'vitest';

import {
  ACCOUNT_BILLING_ACTION_IDS,
  ACCOUNT_BILLING_ACTIONS,
  ACCOUNT_BILLING_COPY,
  DEFAULT_PRO_RESTORE_REQUEST,
  isAccountBillingActionId,
  isProRestoreOutcome,
  PRO_RESTORE_OUTCOMES,
  PRO_RESTORE_ROUTE,
  STRIPE_BILLING_PORTAL_ROUTE,
} from '../contracts';
import { isBillingEntitlementStatus } from '../types';

describe('billing api contracts for sprint 15.2 phase 0', () => {
  it('defines restore contract and outcomes', () => {
    expect(PRO_RESTORE_ROUTE).toBe('/api/pro/restore');
    expect(DEFAULT_PRO_RESTORE_REQUEST).toEqual({ trigger: 'account' });
    expect(PRO_RESTORE_OUTCOMES).toEqual(['restored', 'already_active', 'not_found']);
    expect(isProRestoreOutcome('restored')).toBe(true);
    expect(isProRestoreOutcome('failed')).toBe(false);
  });

  it('defines account billing-link action contract and copy', () => {
    expect(ACCOUNT_BILLING_ACTION_IDS).toEqual(['manage_billing', 'restore_purchase']);
    expect(ACCOUNT_BILLING_ACTIONS.manage_billing).toEqual({
      label: 'Manage billing / invoices',
      href: STRIPE_BILLING_PORTAL_ROUTE,
      method: 'GET',
      description: 'Open Stripe-hosted billing history and invoice access.',
    });
    expect(ACCOUNT_BILLING_ACTIONS.restore_purchase).toEqual({
      label: 'Restore purchase',
      href: PRO_RESTORE_ROUTE,
      method: 'POST',
      description: 'Re-check completed purchases for this account and re-sync entitlement safely.',
    });
    expect(ACCOUNT_BILLING_COPY.restoreHint).toMatch(/previously completed purchases/i);
    expect(isAccountBillingActionId('manage_billing')).toBe(true);
    expect(isAccountBillingActionId('invalid')).toBe(false);
  });

  it('guards compatible entitlement status values for restore responses', () => {
    expect(isBillingEntitlementStatus('active')).toBe(true);
    expect(isBillingEntitlementStatus('revoked')).toBe(true);
    expect(isBillingEntitlementStatus('none')).toBe(true);
    expect(isBillingEntitlementStatus('expired')).toBe(false);
  });
});
