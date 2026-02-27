import type { ReactNode } from 'react';

type NoticeTone = 'neutral' | 'error' | 'success';

type NoticeProps = {
  tone?: NoticeTone;
  children: ReactNode;
};

const toneClasses: Record<NoticeTone, string> = {
  neutral:
    'border-[color:var(--color-border-subtle)] bg-[var(--color-bg-muted)] text-[color:var(--color-text-secondary)]',
  error:
    'border-[color:var(--color-state-error)] bg-[var(--color-state-error-soft)] text-[color:var(--color-state-error)]',
  success:
    'border-[color:var(--color-state-success)] bg-[var(--color-state-success-soft)] text-[color:var(--color-state-success)]',
};

export function Notice({ tone = 'neutral', children }: NoticeProps) {
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClasses[tone]}`.trim()}>
      {children}
    </div>
  );
}
