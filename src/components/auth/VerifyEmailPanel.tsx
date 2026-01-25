'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { resendVerificationSchema, verifyEmailSchema } from '../../lib/api/auth/validation';
import { getApiErrorMessage, parseJson } from '../../lib/api/client';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { type ToastItem, ToastStack } from '../ui/Toast';

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
  const [verifyState, setVerifyState] = useState<'idle' | 'verifying' | 'done' | 'error'>('idle');
  const [resending, setResending] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);

  const pushToast = (message: string, tone: ToastItem['tone'] = 'neutral') => {
    const id = toastIdRef.current + 1;
    toastIdRef.current = id;
    setToasts((prev) => [...prev, { id, tone, message, state: 'entering' }]);

    window.requestAnimationFrame(() => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, state: 'open' } : toast)),
      );
    });

    window.setTimeout(() => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, state: 'closing' } : toast)),
      );
    }, 4500);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4800);
  };

  useEffect(() => {
    if (!token) return;

    const parsed = verifyEmailSchema.safeParse({ token });
    if (!parsed.success) {
      setVerifyState('error');
      pushToast('Verification token is missing or invalid.', 'error');
      return;
    }

    setVerifyState('verifying');

    const verify = async () => {
      const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
      const body = await parseJson<VerifyResponse>(response);

      if (!response.ok || !body?.ok) {
        setVerifyState('error');
        const message = getApiErrorMessage(response, body);
        pushToast(message, 'error');
        return;
      }

      setVerifyState('done');
      pushToast('Email verified. You can sign in.', 'success');
    };

    void verify();
  }, [token]);

  const handleResend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError(false);

    const parsed = resendVerificationSchema.safeParse({ email });
    if (!parsed.success) {
      setEmailError(true);
      pushToast('Enter a valid email.', 'error');
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
        const message = getApiErrorMessage(response, body);
        pushToast(message, 'error');
        return;
      }

      const message =
        body.data.status === 'sent'
          ? 'Verification email resent.'
          : 'If the account exists and is unverified, a link will be sent.';
      pushToast(message, 'success');
    } catch {
      pushToast('Unable to resend. Try again later.', 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-black/60">Verification</p>
        <h2 className="text-2xl font-semibold tracking-tight">
          {verifyState === 'done' ? 'Email verified.' : 'Verify your email.'}
        </h2>
        <p className="text-sm text-black/60">
          {verifyState === 'verifying'
            ? 'We are verifying your link now.'
            : verifyState === 'done'
              ? 'You can sign in once you are ready.'
              : 'Open the verification link from your inbox to continue.'}
        </p>
        {verifyState === 'done' ? (
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-black bg-black px-5 text-sm font-medium text-white transition hover:bg-black/90"
            href="/sign-in"
          >
            Continue to sign in
          </Link>
        ) : null}
      </div>

      <form className="space-y-6 border-t border-black/10 pt-6" onSubmit={handleResend}>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80">
            Resend verification
          </p>
          <p className="text-sm text-black/60">We only send if the account is unverified.</p>
        </div>
        <FormField id="email" label="Email" error={null}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            className={emailError ? 'border-rose-400 focus-visible:ring-rose-400/30' : ''}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError(false);
            }}
          />
        </FormField>
        <Button type="submit" variant="outline" className="w-full" disabled={resending}>
          {resending ? 'Sending...' : 'Resend verification email'}
        </Button>
      </form>

      <ToastStack toasts={toasts} />
    </div>
  );
}
