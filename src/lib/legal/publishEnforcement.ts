import { hasLegalPublishBlockers, LEGAL_ENTITY_DRAFT_VALUES } from './publishGuard';

const LEGAL_PUBLISH_ENFORCEMENT_FLAG = 'ENFORCE_LEGAL_PUBLISH_READY';

export function shouldEnforceLegalPublishReadiness(nodeEnv: string, flagValue: string): boolean {
  return nodeEnv === 'production' && flagValue === 'true';
}

export function assertLegalPublishReadiness(options: { nodeEnv: string; enforcementFlag: string }) {
  const { nodeEnv, enforcementFlag } = options;
  if (!shouldEnforceLegalPublishReadiness(nodeEnv, enforcementFlag)) {
    return;
  }

  if (!hasLegalPublishBlockers(LEGAL_ENTITY_DRAFT_VALUES)) {
    return;
  }

  throw new Error(
    `Legal publish blockers detected. Resolve legal entity placeholders before production publish, or disable ${LEGAL_PUBLISH_ENFORCEMENT_FLAG}.`,
  );
}
