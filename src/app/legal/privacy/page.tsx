import { LegalPageLayout } from '../../../components/legal/LegalPageLayout';
import { getLegalPolicyDefinition } from '../../../lib/legal/policies';
import { LEGAL_ENTITY_DRAFT_VALUES } from '../../../lib/legal/publishGuard';

const policy = getLegalPolicyDefinition('privacy');

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title={policy.title}
      description={policy.description}
      metadata={policy.metadata}
    >
      <section className="space-y-3">
        <h2 className="text-base font-semibold">What we collect</h2>
        <p>
          Project Atlas stores account details, habit definitions, schedule settings, per-day
          completion records, and support requests required to provide the product.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">How we use data</h2>
        <p>
          Data is used to authenticate your account, show your habit schedule, process completions,
          provide support, and protect the service from abuse.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Support handling and response expectations</h2>
        <p>
          Support requests are stored in our support system for triage and follow-up. We target a
          first response within 2 business days for most requests, but response times can vary based
          on queue volume and issue complexity.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">How to get help faster</h2>
        <p>
          Include exact steps, expected behavior, and actual behavior. For billing help, include the
          purchase email and platform (web, Apple App Store, or Google Play).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Account deletion behavior (hard delete)</h2>
        <p>
          Deleting your account from Account settings permanently removes account and habit data.
          This operation is irreversible and support cannot restore deleted accounts.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Children and age policy</h2>
        <p>
          Project Atlas is not directed to children under 16. If we discover underage use, we may
          remove the account and related data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Contact</h2>
        <p>
          Legal controller details are draft placeholders until incorporation is finalized:
          <br />
          {LEGAL_ENTITY_DRAFT_VALUES.entityName}
          <br />
          {LEGAL_ENTITY_DRAFT_VALUES.registeredAddress}
        </p>
      </section>
    </LegalPageLayout>
  );
}
