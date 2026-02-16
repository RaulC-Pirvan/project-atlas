import Link from 'next/link';

import { AuthShell } from '../../../components/auth/AuthShell';
import { SignInForm } from '../../../components/auth/SignInForm';

export default function SignInPage() {
  const testGoogleProviderEnabled =
    process.env.ENABLE_TEST_ENDPOINTS === 'true' &&
    process.env.ENABLE_TEST_GOOGLE_OAUTH_PROVIDER === 'true';
  const showGoogleSignIn = Boolean(
    (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) || testGoogleProviderEnabled,
  );

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your verified account."
      footer={
        <div className="space-y-2 text-center text-sm text-black/60 dark:text-white/60">
          <p>
            Need an account?{' '}
            <Link
              className="text-black underline underline-offset-4 dark:text-white"
              href="/sign-up"
            >
              Create one
            </Link>
          </p>
          <p>
            <Link className="text-black underline underline-offset-4 dark:text-white" href="/">
              Back to home
            </Link>
          </p>
        </div>
      }
    >
      <SignInForm showGoogleSignIn={showGoogleSignIn} />
    </AuthShell>
  );
}
