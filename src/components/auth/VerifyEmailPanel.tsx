'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { resendVerificationSchema, verifyEmailSchema } from '../../lib/api/auth/validation';
import { getApiErrorMessage, parseJson } from '../../lib/api/client';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Notice } from '../ui/Notice';

type VerifyResponse = {
  userId: string;
};

type ResendResponse = {
  status: 'sent' | 'noop';
};

export function VerifyEmailPanel() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [verifyState, setVerifyState] = useState<'idle' | 'verifying' | 'done' | 'error'>(
    'idle',
  );
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;

    const parsed = verifyEmailSchema.safeParse({ token });
    if (!parsed.success) {
      setVerifyState('error');
      setVerifyMessage('Verification token is missing or invalid.');
      return;
    }

    setVerifyState('verifying');
    setVerifyMessage(null);

    const verify = async () => {
      const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
      const body = await parseJson<VerifyResponse>(response);

      if (!response.ok || !body?.ok) {
        setVerifyState('error');
        setVerifyMessage(getApiErrorMessage(response, body));
        return;
      }

      setVerifyState('done');
      setVerifyMessage('Email verified. You can sign in.');
    };

    void verify();
  }, [token]);

  const handleResend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResendError(null);
    setResendMessage(null);

    const parsed = resendVerificationSchema.safeParse({ email });
    if (!parsed.success) {
      setResendError('Enter a valid email.');
      return;
    }

    setResending(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await parseJson<ResendResponse>(response);

      if (!response.ok || !body?.ok) {
        setResendError(getApiErrorMessage(response, body));
        return;
      }

      setResendMessage(
        body.data.status === 'sent'
          ? 'Verification email resent.'
          : 'If the account exists and is unverified, a link will be sent.',
      );
    } catch {
      setResendError('Unable to resend. Try again later.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-8">
      {verifyState === 'verifying' ? <Notice>Verifying your email...</Notice> : null}
      {verifyMessage ? (
        <Notice tone={verifyState === 'error' ? 'error' : 'success'}>{verifyMessage}</Notice>
      ) : null}

      <form className="space-y-6" onSubmit={handleResend}>
        <FormField id="email" label="Resend verification" hint="We send only if unverified." error={null}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>
        {resendError ? <Notice tone="error">{resendError}</Notice> : null}
        {resendMessage ? <Notice tone="success">{resendMessage}</Notice> : null}
        <Button type="submit" variant="outline" className="w-full" disabled={resending}>
          {resending ? 'Sending...' : 'Resend verification email'}
        </Button>
      </form>
    </div>
  );
}
