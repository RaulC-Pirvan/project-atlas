import type { LegalReleaseNoteTemplateField, LegalUpdateProcedureStep } from './types';

export const LEGAL_UPDATE_PROCEDURE_STEPS: LegalUpdateProcedureStep[] = [
  {
    id: 'draft',
    label: 'Draft',
    description: 'Prepare policy content updates and metadata changes in draft form.',
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Perform product and engineering review to confirm policy-to-product alignment.',
  },
  {
    id: 'legal_sign_off',
    label: 'Legal sign-off',
    description: 'Obtain legal approval before any production publication.',
  },
  {
    id: 'publish',
    label: 'Publish',
    description: 'Release policy changes and append a dated entry to /legal/changes.',
  },
];

export const LEGAL_RELEASE_NOTE_TEMPLATE_FIELDS: LegalReleaseNoteTemplateField[] = [
  {
    id: 'approver',
    label: 'Approver',
    description: 'Name or role of the legal approver.',
  },
  {
    id: 'date',
    label: 'Date',
    description: 'Publication date in YYYY-MM-DD format.',
  },
  {
    id: 'policyVersion',
    label: 'Policy version',
    description: 'Version identifier for the policy release.',
  },
];
