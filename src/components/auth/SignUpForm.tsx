'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

import { signupSchema } from '../../lib/api/auth/validation';
import { getApiErrorMessage, parseJson } from '../../lib/api/client';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { type ToastItem, ToastStack } from '../ui/Toast';

type SignupResponse = {
  userId: string;
};

export function SignUpForm() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [displayNameError, setDisplayNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmError, setConfirmError] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDisplayNameError(false);
    setEmailError(false);
    setPasswordError(false);
    setConfirmError(false);

    const normalizedDisplayName = displayName.trim();
    const emailValid = signupSchema.shape.email.safeParse(email).success;

    if (normalizedDisplayName.length < 2) {
      setDisplayNameError(true);
    }

    if (!emailValid) {
      setEmailError(true);
    }

    if (password.length < 8) {
      setPasswordError(true);
    }

    if (password !== confirm) {
      setPasswordError(true);
      setConfirmError(true);
    }

    if (normalizedDisplayName.length < 2) {
      pushToast('Display name must be at least 2 characters.', 'error');
      return;
    }

    if (!emailValid) {
      pushToast('Enter a valid email address.', 'error');
      return;
    }

    if (password.length < 8) {
      pushToast('Password must be at least 8 characters.', 'error');
      return;
    }

    if (password !== confirm) {
      pushToast('Passwords do not match.', 'error');
      return;
    }

    const parsed = signupSchema.safeParse({ email, password, displayName: normalizedDisplayName });
    if (!parsed.success) {
      pushToast('Enter a valid email and password.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName: displayName.trim() }),
      });

      const body = await parseJson<SignupResponse>(response);

      if (!response.ok || !body?.ok) {
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      setSuccess(true);
    } catch {
      pushToast('Unable to create account. Try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-black/60">Account</p>
          <h2 className="text-2xl font-semibold tracking-tight">You&apos;re in.</h2>
          <p className="text-sm text-black/60">
            We sent a verification link to <span className="font-semibold text-black">{email}</span>
            . Verify to unlock your account.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-black bg-black px-5 text-sm font-medium text-white transition hover:bg-black/90"
            href={`/verify-email?email=${encodeURIComponent(email)}`}
          >
            Open verification page
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-black/15 px-5 text-sm font-medium text-black/70 transition hover:bg-black/5"
            href="/sign-in"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <FormField id="displayName" label="Display name" hint="Minimum 2 characters." error={null}>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          value={displayName}
          className={displayNameError ? 'border-rose-400 focus-visible:ring-rose-400/30' : ''}
          onChange={(event) => {
            setDisplayName(event.target.value);
            if (displayNameError) setDisplayNameError(false);
          }}
          required
        />
      </FormField>
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
      <FormField id="password" label="Password" hint="Minimum 8 characters." error={null}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          className={passwordError ? 'border-rose-400 focus-visible:ring-rose-400/30' : ''}
          onChange={(event) => {
            setPassword(event.target.value);
            if (passwordError) setPasswordError(false);
          }}
        />
      </FormField>
      <FormField id="confirm" label="Confirm password" error={null}>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          className={confirmError ? 'border-rose-400 focus-visible:ring-rose-400/30' : ''}
          onChange={(event) => {
            setConfirm(event.target.value);
            if (confirmError) setConfirmError(false);
          }}
        />
      </FormField>
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? 'Creating account...' : 'Create account'}
      </Button>
      <ToastStack toasts={toasts} />
    </form>
  );
}
