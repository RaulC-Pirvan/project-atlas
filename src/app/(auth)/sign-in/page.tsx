import Link from 'next/link';

import { AuthShell } from '../../../components/auth/AuthShell';
import { SignInForm } from '../../../components/auth/SignInForm';

export default function SignInPage() {
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
      <SignInForm />
    </AuthShell>
  );
}
