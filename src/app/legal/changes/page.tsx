import { LegalPageLayout } from '../../../components/legal/LegalPageLayout';
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
