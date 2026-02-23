'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { signInSchema } from '../../lib/api/auth/validation';
import { parseJson } from '../../lib/api/client';
import { GOOGLE_PROVIDER_ID } from '../../lib/auth/oauthProviders';
import { DEFAULT_POST_AUTH_PATH } from '../../lib/auth/redirects';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Notice } from '../ui/Notice';
import { type ToastItem, ToastStack } from '../ui/Toast';
import { OAuthActionButton } from './OAuthActionButton';

type SignInResponse = {
  ok: boolean;
  requiresTwoFactor?: boolean;
  challengeToken?: string;
  requiresAdminTwoFactorEnrollment?: boolean;
};

type VerifySignInTwoFactorResponse = {
  ok: boolean;
};

type SignInFormProps = {
  showGoogleSignIn?: boolean;
  googleProviderId?: string;
  postSignInPath?: string;
};

type TwoFactorMethod = 'totp' | 'recovery_code';

export function SignInForm({
  showGoogleSignIn = false,
  googleProviderId = GOOGLE_PROVIDER_ID,
  postSignInPath = DEFAULT_POST_AUTH_PATH,
}: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod>('totp');
  const [twoFactorChallengeToken, setTwoFactorChallengeToken] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
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

  const handleCredentialsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError(false);
    setPasswordError(false);

    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setEmailError(true);
      setPasswordError(true);
      pushToast('Enter a valid email and password.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      const body = await parseJson<SignInResponse>(response);

      if (!response.ok || !body?.ok) {
        setEmailError(false);
        setPasswordError(false);
        if (body && !body.ok && body.error.code === 'email_not_verified') {
          pushToast('Account not verified. Check your email for the verification link.', 'error');
        } else if (body && !body.ok && body.error.code === 'invalid_credentials') {
          pushToast('Invalid email or password.', 'error');
        } else {
          pushToast('Unable to sign in. Try again.', 'error');
        }
        return;
      }

      if (body.data.requiresAdminTwoFactorEnrollment) {
        router.push('/account?admin2fa=required');
        router.refresh();
        return;
      }

      if (body.data.requiresTwoFactor && body.data.challengeToken) {
        setTwoFactorChallengeToken(body.data.challengeToken);
        setTwoFactorCode('');
        setPassword('');
        pushToast('Enter your authenticator code to finish signing in.', 'neutral');
        return;
      }

      router.push(postSignInPath);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleTwoFactorSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!twoFactorChallengeToken) {
      pushToast('2FA challenge is missing. Sign in again.', 'error');
      return;
    }

    if (!twoFactorCode.trim()) {
      pushToast('Enter your verification code.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/sign-in/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: twoFactorChallengeToken,
          method: twoFactorMethod,
          code: twoFactorCode,
        }),
      });
      const body = await parseJson<VerifySignInTwoFactorResponse>(response);

      if (!response.ok || !body?.ok) {
        if (body && !body.ok && body.error.code === 'rate_limited') {
          pushToast('Too many attempts. Try again later.', 'error');
        } else {
          pushToast('Invalid authentication code.', 'error');
        }
        return;
      }

      router.push(postSignInPath);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const showingTwoFactorChallenge = Boolean(twoFactorChallengeToken);

  return (
    <form
      className="space-y-6"
      onSubmit={showingTwoFactorChallenge ? handleTwoFactorSubmit : handleCredentialsSubmit}
    >
      {!showingTwoFactorChallenge ? (
        <>
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
          <FormField id="password" label="Password" error={null}>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              className={passwordError ? 'border-rose-400 focus-visible:ring-rose-400/30' : ''}
              onChange={(event) => {
                setPassword(event.target.value);
                if (passwordError) setPasswordError(false);
              }}
            />
          </FormField>
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </>
      ) : (
        <>
          <Notice tone="neutral">Two-factor verification is required for this account.</Notice>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={twoFactorMethod === 'totp' ? 'primary' : 'outline'}
              onClick={() => setTwoFactorMethod('totp')}
            >
              Authenticator code
            </Button>
            <Button
              type="button"
              size="sm"
              variant={twoFactorMethod === 'recovery_code' ? 'primary' : 'outline'}
              onClick={() => setTwoFactorMethod('recovery_code')}
            >
              Recovery code
            </Button>
          </div>
          <FormField id="two-factor-code" label="Verification code" error={null}>
            <Input
              id="two-factor-code"
              name="two-factor-code"
              autoComplete="one-time-code"
              inputMode={twoFactorMethod === 'totp' ? 'numeric' : 'text'}
              value={twoFactorCode}
              onChange={(event) => setTwoFactorCode(event.target.value)}
            />
          </FormField>
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? 'Verifying...' : 'Verify and sign in'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setTwoFactorChallengeToken(null);
              setTwoFactorCode('');
            }}
          >
            Back to password sign-in
          </Button>
        </>
      )}
      {!showingTwoFactorChallenge && showGoogleSignIn ? (
        <>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
            <p className="text-xs uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
              Or continue with Google
            </p>
            <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          </div>
          <OAuthActionButton
            provider="google"
            providerId={googleProviderId}
            callbackUrl={postSignInPath}
            label="Continue with Google"
            onError={(message) => pushToast(message, 'error')}
          />
        </>
      ) : null}
      <ToastStack toasts={toasts} />
    </form>
  );
}
