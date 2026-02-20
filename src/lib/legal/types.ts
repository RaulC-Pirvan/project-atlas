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

export type LegalProcedureStepId = 'draft' | 'review' | 'legal_sign_off' | 'publish';

export type LegalUpdateProcedureStep = {
  id: LegalProcedureStepId;
  label: string;
  description: string;
};

export type LegalReleaseNoteTemplateFieldId = 'approver' | 'date' | 'policyVersion';

export type LegalReleaseNoteTemplateField = {
  id: LegalReleaseNoteTemplateFieldId;
  label: string;
  description: string;
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
