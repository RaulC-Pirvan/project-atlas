import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-black/10 bg-white p-8 shadow-[0_1px_0_rgba(0,0,0,0.08)] ${className}`.trim()}
    >
      {children}
    </div>
  );
}
