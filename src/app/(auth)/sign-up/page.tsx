import Link from 'next/link';

import { AuthShell } from '../../../components/auth/AuthShell';
import { SignUpForm } from '../../../components/auth/SignUpForm';

export default function SignUpPage() {
  const showGoogleSignIn = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
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
      <SignUpForm showGoogleSignIn={showGoogleSignIn} />
    </AuthShell>
  );
}
