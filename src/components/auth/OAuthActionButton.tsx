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

const providerIdOverride = process.env.NEXT_PUBLIC_ATLAS_GOOGLE_PROVIDER_ID?.trim();
const resolvedGoogleProviderId =
  providerIdOverride && providerIdOverride.length > 0 ? providerIdOverride : 'google';

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="h-[18px] w-[18px]">
      <path
        fill="#4285F4"
        d="M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2582h2.9086c1.7018-1.5668 2.6837-3.8732 2.6837-6.6155z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1791l-2.9086-2.2582c-.8059.54-1.8368.8591-3.0478.8591-2.3441 0-4.3282-1.5823-5.0368-3.7091H.9568v2.3327C2.4377 15.9868 5.4818 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.9632 10.7127c-.18-.54-.2836-1.1168-.2836-1.7127s.1036-1.1727.2836-1.7127V4.9545H.9568C.3477 6.1682 0 7.5409 0 9s.3477 2.8318.9568 4.0455l3.0064-2.3328z"
      />
      <path
        fill="#EA4335"
        d="M9 3.5782c1.3214 0 2.5077.4541 3.4418 1.3459l2.5814-2.5814C13.4632.8909 11.4259 0 9 0 5.4818 0 2.4377 2.0132.9568 4.9545l3.0064 2.3328C4.6718 5.1605 6.6559 3.5782 9 3.5782z"
      />
    </svg>
  );
}

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
      const providerId = provider === 'google' ? resolvedGoogleProviderId : provider;
      const testEmail = process.env.NEXT_PUBLIC_ATLAS_GOOGLE_TEST_EMAIL?.trim();
      const testName = process.env.NEXT_PUBLIC_ATLAS_GOOGLE_TEST_NAME?.trim();
      const testProviderAccountId =
        process.env.NEXT_PUBLIC_ATLAS_GOOGLE_TEST_PROVIDER_ACCOUNT_ID?.trim();
      const nonce = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

      const providerParams =
        providerId !== 'google'
          ? {
              ...(testEmail
                ? { email: testEmail.replace('@', `+${nonce}@`) }
                : { email: `oauth-e2e-${nonce}@example.com` }),
              ...(testName ? { name: testName } : {}),
              ...(testProviderAccountId
                ? { providerAccountId: `${testProviderAccountId}-${nonce}` }
                : { providerAccountId: `oauth-e2e-sub-${nonce}` }),
              emailVerified: 'true',
            }
          : {};

      const result = await signIn(providerId, { callbackUrl, ...providerParams });
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
      className={`w-full !rounded-xl border-[#d2d2d2] bg-white text-[#1f1f1f] hover:bg-[#f8f9fa] dark:border-[#d2d2d2] dark:bg-white dark:text-[#1f1f1f] dark:hover:bg-[#f8f9fa] ${className ?? ''}`.trim()}
      disabled={disabled || submitting}
      onClick={handleClick}
    >
      {provider === 'google' ? <GoogleIcon /> : null}
      {submitting ? 'Redirecting...' : label}
    </Button>
  );
}
