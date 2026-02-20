import { LegalPageLayout } from '../../../components/legal/LegalPageLayout';
import {
  LEGAL_RELEASE_NOTE_TEMPLATE_FIELDS,
  LEGAL_UPDATE_PROCEDURE_STEPS,
} from '../../../lib/legal/governance';
import { LEGAL_CHANGE_LOG, LEGAL_CHANGES_METADATA } from '../../../lib/legal/policies';
import {
  buildLegalPublishChecklist,
  hasLegalPublishBlockers,
  LEGAL_ENTITY_DRAFT_VALUES,
} from '../../../lib/legal/publishGuard';

const publishChecklist = buildLegalPublishChecklist(LEGAL_ENTITY_DRAFT_VALUES);
const hasBlockers = hasLegalPublishBlockers(LEGAL_ENTITY_DRAFT_VALUES);

export default function LegalChangesPage() {
  return (
    <LegalPageLayout
      title="Policy changes"
      description="Track policy updates and pre-production legal placeholder checks."
      metadata={LEGAL_CHANGES_METADATA}
    >
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Change log</h2>
        <ul className="space-y-3">
          {LEGAL_CHANGE_LOG.map((entry) => (
            <li key={`${entry.date}-${entry.summary}`} className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/55 dark:text-white/55">
                {entry.date}
              </p>
              <p>{entry.summary}</p>
              <p className="text-xs text-black/55 dark:text-white/55">
                Policies: {entry.policyIds.join(', ')}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Policy update procedure</h2>
        <p>Draft -&gt; review -&gt; legal sign-off -&gt; publish.</p>
        <ol className="space-y-2">
          {LEGAL_UPDATE_PROCEDURE_STEPS.map((step) => (
            <li key={step.id}>
              <p className="text-sm font-medium">{step.label}</p>
              <p className="text-xs text-black/60 dark:text-white/60">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Release-note template fields</h2>
        <p>Each policy release note must include the fields below.</p>
        <ul className="space-y-2">
          {LEGAL_RELEASE_NOTE_TEMPLATE_FIELDS.map((field) => (
            <li
              key={field.id}
              className="rounded-xl border border-black/10 px-4 py-3 dark:border-white/10"
            >
              <p className="text-sm font-medium">{field.label}</p>
              <p className="text-xs text-black/60 dark:text-white/60">{field.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Pre-publish placeholder guard</h2>
        <p>
          Production publish is blocked until all legal entity placeholders are replaced with final
          values.
        </p>
        <ul className="space-y-2">
          {publishChecklist.map((item) => (
            <li key={item.field} className="flex items-center justify-between gap-3">
              <span>{item.label}</span>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  item.isBlocking
                    ? 'border border-black/20 bg-black text-white dark:border-white/20 dark:bg-white dark:text-black'
                    : 'border border-black/15 bg-white text-black/70 dark:border-white/15 dark:bg-black dark:text-white/70'
                }`}
              >
                {item.isBlocking ? 'Placeholder' : 'Ready'}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs uppercase tracking-[0.2em] text-black/55 dark:text-white/55">
          Publish status: {hasBlockers ? 'Blocked' : 'Ready'}
        </p>
      </section>
    </LegalPageLayout>
  );
}
