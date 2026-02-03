import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-black/10 bg-white p-8 shadow-[0_12px_30px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-black/70 dark:shadow-[0_18px_40px_rgba(0,0,0,0.45)] ${className}`.trim()}
    >
      {children}
    </div>
  );
}
