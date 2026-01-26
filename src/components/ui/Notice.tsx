import type { ReactNode } from 'react';

type NoticeTone = 'neutral' | 'error' | 'success';

type NoticeProps = {
  tone?: NoticeTone;
  children: ReactNode;
};

const toneClasses: Record<NoticeTone, string> = {
  neutral: 'border-black/10 bg-black/5 text-black/80',
  error: 'border-black bg-white text-black',
  success: 'border-black/40 bg-white text-black',
};

export function Notice({ tone = 'neutral', children }: NoticeProps) {
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClasses[tone]}`.trim()}>
      {children}
    </div>
  );
}
