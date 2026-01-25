'use client';

import { Button } from '../ui/Button';

export function SignOutButton() {
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/sign-in';
    }
  };

  return (
    <Button type="button" variant="ghost" onClick={handleSignOut}>
      Sign out
    </Button>
  );
}
