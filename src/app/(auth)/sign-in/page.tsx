import Link from 'next/link';

import { AuthShell } from '../../../components/auth/AuthShell';
import { SignInForm } from '../../../components/auth/SignInForm';
import { GOOGLE_PROVIDER_ID, TEST_GOOGLE_PROVIDER_ID } from '../../../lib/auth/oauthProviders';
import { resolveSafePostAuthPath } from '../../../lib/auth/redirects';

export const dynamic = 'force-dynamic';

type SearchParams = {
  from?: string | string[];
};

function parseSearchParamValue(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const normalized = raw.trim();
  return normalized.length > 0 ? normalized : null;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const testGoogleProviderEnabled =
    process.env.ENABLE_TEST_ENDPOINTS === 'true' &&
    process.env.ENABLE_TEST_GOOGLE_OAUTH_PROVIDER === 'true';
  const googleProviderId = testGoogleProviderEnabled ? TEST_GOOGLE_PROVIDER_ID : GOOGLE_PROVIDER_ID;
  const showGoogleSignIn = Boolean(
    (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) || testGoogleProviderEnabled,
  );
  const resolvedSearchParams = await searchParams;
  const postSignInPath = resolveSafePostAuthPath(parseSearchParamValue(resolvedSearchParams?.from));

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
      <SignInForm
        showGoogleSignIn={showGoogleSignIn}
        googleProviderId={googleProviderId}
        postSignInPath={postSignInPath}
      />
    </AuthShell>
  );
}
