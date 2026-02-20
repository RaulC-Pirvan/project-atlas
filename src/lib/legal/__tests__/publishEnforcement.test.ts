import { describe, expect, it } from 'vitest';

import {
  assertLegalPublishReadiness,
  shouldEnforceLegalPublishReadiness,
} from '../publishEnforcement';

describe('legal publish enforcement', () => {
  it('enforces only in production with explicit flag', () => {
    expect(shouldEnforceLegalPublishReadiness('development', 'true')).toBe(false);
    expect(shouldEnforceLegalPublishReadiness('production', 'false')).toBe(false);
    expect(shouldEnforceLegalPublishReadiness('production', 'true')).toBe(true);
  });

  it('throws when placeholders exist and enforcement is enabled', () => {
    expect(() =>
      assertLegalPublishReadiness({
        nodeEnv: 'production',
        enforcementFlag: 'true',
      }),
    ).toThrow(/legal publish blockers detected/i);
  });

  it('does not throw when enforcement is disabled', () => {
    expect(() =>
      assertLegalPublishReadiness({
        nodeEnv: 'production',
        enforcementFlag: 'false',
      }),
    ).not.toThrow();
  });
});
