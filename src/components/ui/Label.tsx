import type { LabelHTMLAttributes } from 'react';

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className = '', ...props }: LabelProps) {
  return (
    <label
      className={`block text-xs font-semibold uppercase tracking-[0.2em] text-black/60 dark:text-white/60 ${className}`.trim()}
      {...props}
    />
  );
}
