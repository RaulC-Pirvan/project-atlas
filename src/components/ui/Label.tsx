import type { LabelHTMLAttributes } from 'react';

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className = '', ...props }: LabelProps) {
  return (
    <label
      className={`text-xs font-semibold uppercase tracking-[0.2em] text-black/60 ${className}`.trim()}
      {...props}
    />
  );
}
