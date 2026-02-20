import { describe, expect, it } from 'vitest';

import { applySupportTicketStatusTransition, canTransitionSupportTicketStatus } from '../lifecycle';

describe('support ticket lifecycle', () => {
  it('allows open -> in_progress transition', () => {
    expect(canTransitionSupportTicketStatus('open', 'in_progress')).toBe(true);
  });

  it('rejects resolved -> open transition', () => {
    expect(canTransitionSupportTicketStatus('resolved', 'open')).toBe(false);
  });

  it('sets inProgressAt and clears resolvedAt when transitioning to in_progress', () => {
    const changedAt = new Date('2026-02-19T11:00:00.000Z');

    const result = applySupportTicketStatusTransition({
      currentStatus: 'open',
      nextStatus: 'in_progress',
      changedAt,
      currentTimestamps: { inProgressAt: null, resolvedAt: null },
    });

    expect(result).toEqual({ inProgressAt: changedAt, resolvedAt: null });
  });

  it('sets resolvedAt when transitioning to resolved', () => {
    const startedAt = new Date('2026-02-19T11:00:00.000Z');
    const changedAt = new Date('2026-02-19T12:00:00.000Z');

    const result = applySupportTicketStatusTransition({
      currentStatus: 'in_progress',
      nextStatus: 'resolved',
      changedAt,
      currentTimestamps: { inProgressAt: startedAt, resolvedAt: null },
    });

    expect(result).toEqual({ inProgressAt: startedAt, resolvedAt: changedAt });
  });

  it('throws for invalid transition', () => {
    expect(() =>
      applySupportTicketStatusTransition({
        currentStatus: 'resolved',
        nextStatus: 'open',
        currentTimestamps: { inProgressAt: null, resolvedAt: new Date('2026-02-19T10:00:00.000Z') },
      }),
    ).toThrow('Invalid support ticket status transition');
  });
});
