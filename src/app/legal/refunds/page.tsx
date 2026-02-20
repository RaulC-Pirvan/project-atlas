import { LegalPageLayout } from '../../../components/legal/LegalPageLayout';
import { getLegalPolicyDefinition } from '../../../lib/legal/policies';

const policy = getLegalPolicyDefinition('refunds');

export default function RefundsPage() {
  return (
    <LegalPageLayout
      title={policy.title}
      description={policy.description}
      metadata={policy.metadata}
    >
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Direct web purchases</h2>
        <p>
          Atlas Pro is sold as a one-time purchase. For direct web purchases, we offer a 14-day
          goodwill refund window from purchase date.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">App-store purchases</h2>
        <p>Apple App Store purchases follow Apple refund processes.</p>
        <p>Google Play purchases follow Google refund processes.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">How to request help</h2>
        <p>
          Use the Support Center with purchase email, platform, order details, and a short request
          summary so billing review can be completed faster.
        </p>
        <p>
          We target first billing responses within 2 business days for most requests, with timing
          depending on queue volume and case complexity.
        </p>
      </section>
    </LegalPageLayout>
  );
}
