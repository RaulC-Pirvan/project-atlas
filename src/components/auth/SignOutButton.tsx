'use client';

import { Button } from '../ui/Button';

type SignOutButtonProps = {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function SignOutButton({
  variant = 'ghost',
  size = 'md',
  className = '',
}: SignOutButtonProps) {
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/sign-in';
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
    >
      Sign out
    </Button>
  );
}
