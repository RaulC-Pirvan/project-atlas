import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-full border text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-ring)] disabled:pointer-events-none disabled:opacity-50';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-[color:var(--color-accent-solid)] bg-[var(--color-accent-solid)] text-[color:var(--color-text-on-accent)] hover:border-[color:var(--color-accent-strong)] hover:bg-[var(--color-accent-strong)]',
  outline:
    'border-[color:var(--color-border-strong)] bg-[var(--color-bg-surface)] text-[color:var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]',
  ghost:
    'border-transparent bg-transparent text-[color:var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]',
  danger:
    'border-[color:var(--color-state-error)] bg-[var(--color-state-error-soft)] text-[color:var(--color-state-error)] hover:opacity-90',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4',
  md: 'h-11 px-5',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
    const classes =
      `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();
    return <button ref={ref} className={classes} {...props} />;
  },
);

Button.displayName = 'Button';
