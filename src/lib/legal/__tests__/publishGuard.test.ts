import { describe, expect, it } from 'vitest';

import {
  buildLegalPublishChecklist,
  hasLegalPublishBlockers,
  LEGAL_ENTITY_DRAFT_VALUES,
} from '../publishGuard';

describe('legal publish guard', () => {
  it('flags draft placeholders as blocking', () => {
    const checklist = buildLegalPublishChecklist(LEGAL_ENTITY_DRAFT_VALUES);

    expect(checklist.length).toBe(4);
    checklist.forEach((item) => {
      expect(item.isBlocking).toBe(true);
    });
    expect(hasLegalPublishBlockers(LEGAL_ENTITY_DRAFT_VALUES)).toBe(true);
  });

  it('allows publish when placeholders are fully replaced', () => {
    const checklist = buildLegalPublishChecklist({
      entityName: 'Atlas Habit Systems SRL',
      registeredAddress: 'Bucharest, Romania',
      courtVenueCity: 'Bucharest',
      registrationNumber: 'RO12345678',
    });

    checklist.forEach((item) => {
      expect(item.isBlocking).toBe(false);
    });
    expect(
      hasLegalPublishBlockers({
        entityName: 'Atlas Habit Systems SRL',
        registeredAddress: 'Bucharest, Romania',
        courtVenueCity: 'Bucharest',
        registrationNumber: 'RO12345678',
      }),
    ).toBe(false);
  });
});
