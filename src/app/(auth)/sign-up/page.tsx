import Link from 'next/link';

import { AuthShell } from '../../../components/auth/AuthShell';
import { SignUpForm } from '../../../components/auth/SignUpForm';
import { GOOGLE_PROVIDER_ID, TEST_GOOGLE_PROVIDER_ID } from '../../../lib/auth/oauthProviders';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  const testGoogleProviderEnabled =
    process.env.ENABLE_TEST_ENDPOINTS === 'true' &&
    process.env.ENABLE_TEST_GOOGLE_OAUTH_PROVIDER === 'true';
  const googleProviderId = testGoogleProviderEnabled ? TEST_GOOGLE_PROVIDER_ID : GOOGLE_PROVIDER_ID;
  const showGoogleSignIn = Boolean(
    (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) || testGoogleProviderEnabled,
  );

  return (
    <AuthShell
      title="Create your account"
      subtitle="Minimal setup now. Verification required before login."
      footer={
        <p className="text-center text-sm text-black/60 dark:text-white/60">
          Already have an account?{' '}
          <Link className="text-black underline underline-offset-4 dark:text-white" href="/sign-in">
            Sign in
          </Link>
        </p>
      }
    >
      <SignUpForm showGoogleSignIn={showGoogleSignIn} googleProviderId={googleProviderId} />
    </AuthShell>
  );
}
