'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

import { Button } from '../ui/Button';

type OAuthProvider = 'google';

type OAuthActionButtonProps = {
  provider: OAuthProvider;
  callbackUrl: string;
  label: string;
  disabled?: boolean;
  className?: string;
  onError?: (message: string) => void;
};

const providerText: Record<OAuthProvider, string> = {
  google: 'Google',
};

export function OAuthActionButton({
  provider,
  callbackUrl,
  label,
  disabled = false,
  className,
  onError,
}: OAuthActionButtonProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleClick = async () => {
    setSubmitting(true);
    try {
      const result = await signIn(provider, { callbackUrl });
      if (result?.error) {
        onError?.(`Unable to continue with ${providerText[provider]}. Try again.`);
      }
    } catch {
      onError?.(`Unable to continue with ${providerText[provider]}. Try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      className={`w-full ${className ?? ''}`.trim()}
      disabled={disabled || submitting}
      onClick={handleClick}
    >
      <span
        aria-hidden="true"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px] font-semibold"
      >
        G
      </span>
      {submitting ? 'Redirecting...' : label}
    </Button>
  );
}
