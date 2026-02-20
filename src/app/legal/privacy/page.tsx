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
        <h2 className="text-base font-semibold">Account deletion behavior</h2>
        <p>
          Deleting your account from Account settings permanently removes account and habit data.
          This operation is irreversible and support cannot restore deleted accounts.
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
