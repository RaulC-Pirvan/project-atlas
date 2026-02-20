import { describe, expect, it } from 'vitest';

import { LEGAL_RELEASE_NOTE_TEMPLATE_FIELDS, LEGAL_UPDATE_PROCEDURE_STEPS } from '../governance';

describe('legal governance constants', () => {
  it('defines the required policy update procedure order', () => {
    expect(LEGAL_UPDATE_PROCEDURE_STEPS.map((step) => step.id)).toEqual([
      'draft',
      'review',
      'legal_sign_off',
      'publish',
    ]);
  });

  it('includes required release-note template fields', () => {
    expect(LEGAL_RELEASE_NOTE_TEMPLATE_FIELDS.map((field) => field.id)).toEqual([
      'approver',
      'date',
      'policyVersion',
    ]);
  });
});
