import Link from 'next/link';

import { AuthShell } from '../../../components/auth/AuthShell';
import { SignInForm } from '../../../components/auth/SignInForm';

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your verified account."
      footer={
        <p className="text-center text-sm text-black/60">
          Need an account?{' '}
          <Link className="text-black underline underline-offset-4" href="/sign-up">
            Create one
          </Link>
        </p>
      }
    >
      <SignInForm />
    </AuthShell>
  );
}
