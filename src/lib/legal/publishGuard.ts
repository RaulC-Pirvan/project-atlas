import type { LegalEntityDraftValues, LegalEntityField, LegalPublishChecklistItem } from './types';

const PLACEHOLDER_TOKEN = 'tbd';

export const LEGAL_ENTITY_DRAFT_VALUES: LegalEntityDraftValues = {
  entityName: 'Project Atlas legal entity (TBD)',
  registeredAddress: 'Registered address (TBD)',
  courtVenueCity: 'Court venue city (TBD)',
  registrationNumber: 'VAT/company registration number (TBD)',
};

export const LEGAL_ENTITY_FIELD_LABELS: Record<LegalEntityField, string> = {
  entityName: 'Legal entity name',
  registeredAddress: 'Registered address',
  courtVenueCity: 'Court venue city',
  registrationNumber: 'VAT/company registration number',
};

function isPlaceholderValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.length === 0 || normalized.includes(PLACEHOLDER_TOKEN);
}

export function buildLegalPublishChecklist(
  draftValues: LegalEntityDraftValues,
): LegalPublishChecklistItem[] {
  return (Object.keys(LEGAL_ENTITY_FIELD_LABELS) as LegalEntityField[]).map((field) => {
    const value = draftValues[field];
    return {
      field,
      label: LEGAL_ENTITY_FIELD_LABELS[field],
      value,
      isBlocking: isPlaceholderValue(value),
    };
  });
}

export function hasLegalPublishBlockers(draftValues: LegalEntityDraftValues): boolean {
  return buildLegalPublishChecklist(draftValues).some((item) => item.isBlocking);
}
