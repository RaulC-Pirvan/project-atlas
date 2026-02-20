import { describe, expect, it } from 'vitest';

import { LEGAL_CHANGE_LOG } from '../policies';

describe('legal change log', () => {
  it('contains initial publication baseline entries', () => {
    expect(LEGAL_CHANGE_LOG.length).toBeGreaterThanOrEqual(3);
    expect(LEGAL_CHANGE_LOG[0]?.summary).toMatch(/initial publication baseline/i);
  });

  it('uses short-form dated entries linked to core policy pages', () => {
    LEGAL_CHANGE_LOG.forEach((entry) => {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.summary.length).toBeGreaterThan(10);
      expect(entry.policyIds.length).toBeGreaterThan(0);
    });
  });
});
