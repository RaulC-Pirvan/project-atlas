import { LegalPageLayout } from '../../../components/legal/LegalPageLayout';
import { getLegalPolicyDefinition } from '../../../lib/legal/policies';
import { LEGAL_ENTITY_DRAFT_VALUES } from '../../../lib/legal/publishGuard';

const policy = getLegalPolicyDefinition('terms');

export default function TermsPage() {
  return (
    <LegalPageLayout
      title={policy.title}
      description={policy.description}
      metadata={policy.metadata}
    >
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Eligibility</h2>
        <p>
          You must be at least 16 years old to use Project Atlas. The service is not directed to
          children under 16. If underage use is identified, we may remove the account and related
          data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Service boundaries</h2>
        <p>
          Atlas tracks habit completions by schedule and date boundaries. History backfill beyond
          the grace window is blocked to preserve consistent records.
        </p>
        <p>
          Completion rules are limited to today and yesterday (until 02:00 local time). Future dates
          remain blocked.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Account deletion behavior (hard delete)</h2>
        <p>
          If you request account deletion, account and habit data are permanently removed. Deleted
          accounts are not recoverable by support.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Support response expectations</h2>
        <p>
          We target first support responses within 2 business days for most requests. Response times
          may vary based on ticket volume and complexity.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Governing law and consumer rights</h2>
        <p>These Terms are governed by Romanian law.</p>
        <p>
          Venue is the competent courts at the company&apos;s registered office in Romania (court
          venue city to be finalized after incorporation: {LEGAL_ENTITY_DRAFT_VALUES.courtVenueCity}
          ).
        </p>
        <p>
          If you are a consumer, mandatory protections of your country of residence remain
          applicable.
        </p>
        <p>Nothing in these Terms limits your rights under mandatory consumer law.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Legal entity draft fields</h2>
        <p>{LEGAL_ENTITY_DRAFT_VALUES.entityName}</p>
        <p>{LEGAL_ENTITY_DRAFT_VALUES.registrationNumber}</p>
      </section>
    </LegalPageLayout>
  );
}
