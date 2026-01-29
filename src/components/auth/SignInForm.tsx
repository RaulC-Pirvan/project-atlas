'use client';

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useRef, useState } from 'react';

import { signInSchema } from '../../lib/api/auth/validation';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { type ToastItem, ToastStack } from '../ui/Toast';

type SignInResponse = {
  ok: boolean;
  error?: string | null;
};

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
      const result = (await signIn('credentials', {
        redirect: false,
        email,
        password,
      })) as SignInResponse | undefined;

      if (!result || !result.ok) {
        setEmailError(false);
        setPasswordError(false);
        if (result?.error === 'EMAIL_NOT_VERIFIED') {
          pushToast('Account not verified. Check your email for the verification link.', 'error');
        } else {
          pushToast('Invalid email or password.', 'error');
        }
        return;
      }

      router.push('/calendar');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
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
      <ToastStack toasts={toasts} />
    </form>
  );
}
