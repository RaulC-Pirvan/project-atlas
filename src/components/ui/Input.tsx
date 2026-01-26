import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const baseClasses =
  'h-11 w-full rounded-full border border-black/15 bg-white px-4 text-sm text-black placeholder:text-black/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    const classes = `${baseClasses} ${className}`.trim();
    return <input ref={ref} className={classes} {...props} />;
  },
);

Input.displayName = 'Input';
