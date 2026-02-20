import { describe, expect, it } from 'vitest';

import {
  computeSupportRetentionExpiresAt,
  getSupportRetentionCutoff,
  getSupportRetentionMonths,
  isSupportTicketEligibleForDeletion,
  isSupportTicketRetentionExpired,
  isSupportTicketUnderLegalHold,
} from '../retention';

describe('support retention helpers', () => {
  it('uses 18 months as retention window', () => {
    expect(getSupportRetentionMonths()).toBe(18);
  });

  it('computes retention expiry at +18 months', () => {
    const createdAt = new Date('2026-02-19T00:00:00.000Z');
    const expiresAt = computeSupportRetentionExpiresAt(createdAt);

    expect(expiresAt.toISOString()).toBe('2027-08-19T00:00:00.000Z');
  });

  it('computes retention cutoff at -18 months', () => {
    const now = new Date('2028-02-19T00:00:00.000Z');
    const cutoff = getSupportRetentionCutoff(now);

    expect(cutoff.toISOString()).toBe('2026-08-19T00:00:00.000Z');
  });

  it('marks ticket retention as expired when cutoff is reached', () => {
    const now = new Date('2027-08-19T00:00:00.000Z');
    expect(
      isSupportTicketRetentionExpired(
        { retentionExpiresAt: new Date('2027-08-19T00:00:00.000Z') },
        now,
      ),
    ).toBe(true);
  });

  it('blocks deletion while legal hold is active', () => {
    const now = new Date('2027-08-20T00:00:00.000Z');
    expect(
      isSupportTicketUnderLegalHold({ legalHoldUntil: new Date('2027-08-21T00:00:00.000Z') }, now),
    ).toBe(true);

    expect(
      isSupportTicketEligibleForDeletion(
        {
          retentionExpiresAt: new Date('2027-08-19T00:00:00.000Z'),
          legalHoldUntil: new Date('2027-08-21T00:00:00.000Z'),
        },
        now,
      ),
    ).toBe(false);
  });

  it('allows deletion when retention is expired and legal hold is absent', () => {
    const now = new Date('2027-08-20T00:00:00.000Z');
    expect(
      isSupportTicketEligibleForDeletion(
        {
          retentionExpiresAt: new Date('2027-08-19T00:00:00.000Z'),
          legalHoldUntil: null,
        },
        now,
      ),
    ).toBe(true);
  });
});
