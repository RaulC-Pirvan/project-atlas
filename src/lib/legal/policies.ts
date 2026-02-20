import type {
  LegalChangeLogEntry,
  LegalPolicyDefinition,
  LegalPolicyId,
  LegalPolicyMetadata,
  LegalRouteId,
} from './types';

const DEFAULT_POLICY_METADATA: LegalPolicyMetadata = {
  version: '0.1.0-draft',
  effectiveDate: '2026-02-20',
  updatedAt: '2026-02-20',
};

export const LEGAL_POLICY_DEFINITIONS: Record<LegalPolicyId, LegalPolicyDefinition> = {
  privacy: {
    id: 'privacy',
    title: 'Privacy policy',
    description: 'How Project Atlas collects, uses, and retains account, habit, and support data.',
    path: '/legal/privacy',
    metadata: DEFAULT_POLICY_METADATA,
  },
  terms: {
    id: 'terms',
    title: 'Terms of service',
    description:
      'Usage rules for Project Atlas, including eligibility, account behavior, and legal rights.',
    path: '/legal/terms',
    metadata: DEFAULT_POLICY_METADATA,
  },
  refunds: {
    id: 'refunds',
    title: 'Refund policy',
    description: 'How one-time Pro refunds are handled across direct web and app-store purchases.',
    path: '/legal/refunds',
    metadata: DEFAULT_POLICY_METADATA,
  },
};

export const LEGAL_CHANGES_METADATA: LegalPolicyMetadata = {
  version: '0.1.0-draft',
  effectiveDate: '2026-02-20',
  updatedAt: '2026-02-20',
};

export const LEGAL_CHANGE_LOG: LegalChangeLogEntry[] = [
  {
    date: '2026-02-20',
    summary: 'Initial publication baseline for Privacy, Terms, and Refund policy pages.',
    policyIds: ['privacy', 'terms', 'refunds'],
  },
  {
    date: '2026-02-20',
    summary:
      'Policy text aligned with product behavior: hard-delete account removal, 16+ eligibility, and support response expectations.',
    policyIds: ['privacy', 'terms', 'refunds'],
  },
  {
    date: '2026-02-20',
    summary:
      'Cross-surface legal discoverability added to landing, Pro, and account surfaces with explicit policy link labels.',
    policyIds: ['privacy', 'terms', 'refunds'],
  },
];

export const LEGAL_ROUTE_LINKS: Array<{
  id: LegalRouteId;
  label: string;
  href: string;
}> = [
  {
    id: 'privacy',
    label: 'Privacy',
    href: '/legal/privacy',
  },
  {
    id: 'terms',
    label: 'Terms',
    href: '/legal/terms',
  },
  {
    id: 'refunds',
    label: 'Refunds',
    href: '/legal/refunds',
  },
  {
    id: 'changes',
    label: 'Changes',
    href: '/legal/changes',
  },
];

export function getLegalPolicyDefinition(policyId: LegalPolicyId): LegalPolicyDefinition {
  return LEGAL_POLICY_DEFINITIONS[policyId];
}
