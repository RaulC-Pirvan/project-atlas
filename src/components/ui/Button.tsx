import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-full border text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-white/30';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-black bg-black text-white hover:bg-black/90 dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/90',
  outline:
    'border-black/20 bg-white text-black hover:bg-black/5 dark:border-white/20 dark:bg-black dark:text-white dark:hover:bg-white/10',
  ghost:
    'border-transparent bg-transparent text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10',
  danger:
    'border-rose-500/40 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20',
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
