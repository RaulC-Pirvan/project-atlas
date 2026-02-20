export const LEGAL_POLICY_IDS = ['privacy', 'terms', 'refunds'] as const;

export type LegalPolicyId = (typeof LEGAL_POLICY_IDS)[number];

export type LegalRouteId = LegalPolicyId | 'changes';

export type LegalDateString = `${number}-${number}-${number}`;

export type LegalPolicyMetadata = {
  version: string;
  effectiveDate: LegalDateString;
  updatedAt: LegalDateString;
};

export type LegalPolicyDefinition = {
  id: LegalPolicyId;
  title: string;
  description: string;
  path: `/legal/${LegalPolicyId}`;
  metadata: LegalPolicyMetadata;
};

export type LegalChangeLogEntry = {
  date: LegalDateString;
  summary: string;
  policyIds: LegalPolicyId[];
};

export type LegalEntityField =
  | 'entityName'
  | 'registeredAddress'
  | 'courtVenueCity'
  | 'registrationNumber';

export type LegalEntityDraftValues = Record<LegalEntityField, string>;

export type LegalPublishChecklistItem = {
  field: LegalEntityField;
  label: string;
  value: string;
  isBlocking: boolean;
};
