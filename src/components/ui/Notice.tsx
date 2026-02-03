import type { ReactNode } from 'react';

type NoticeTone = 'neutral' | 'error' | 'success';

type NoticeProps = {
  tone?: NoticeTone;
  children: ReactNode;
};

const toneClasses: Record<NoticeTone, string> = {
  neutral:
    'border-black/10 bg-black/5 text-black/80 dark:border-white/10 dark:bg-white/10 dark:text-white/80',
  error: 'border-black bg-white text-black dark:border-white dark:bg-black dark:text-white',
  success: 'border-black/40 bg-white text-black dark:border-white/40 dark:bg-black dark:text-white',
};

export function Notice({ tone = 'neutral', children }: NoticeProps) {
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClasses[tone]}`.trim()}>
      {children}
    </div>
  );
}
