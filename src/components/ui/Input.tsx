import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const baseClasses =
  'h-11 w-full rounded-full border border-[color:var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-4 text-sm text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-muted)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-ring)]';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    const classes = `${baseClasses} ${className}`.trim();
    return <input ref={ref} className={classes} {...props} />;
  },
);

Input.displayName = 'Input';
