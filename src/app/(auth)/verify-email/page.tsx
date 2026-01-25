import Link from 'next/link';
import { Suspense } from 'react';

import { AuthShell } from '../../../components/auth/AuthShell';
import { VerifyEmailPanel } from '../../../components/auth/VerifyEmailPanel';

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Verify your email"
      subtitle="Open the link we sent to complete signup."
      footer={
        <p className="text-center text-sm text-black/60">
          Ready to sign in?{' '}
          <Link className="text-black underline underline-offset-4" href="/sign-in">
            Go to sign in
          </Link>
        </p>
      }
    >
      <Suspense fallback={<p className="text-sm text-black/60">Loading...</p>}>
        <VerifyEmailPanel />
      </Suspense>
    </AuthShell>
  );
}
