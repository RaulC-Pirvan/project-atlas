'use client';

import Link from 'next/link';
import { useState } from 'react';

import { signupSchema } from '../../lib/api/auth/validation';
import { getApiErrorMessage, parseJson } from '../../lib/api/client';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Notice } from '../ui/Notice';

type SignupResponse = {
  userId: string;
};

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = signupSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError('Enter a valid email and password.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const body = await parseJson<SignupResponse>(response);

      if (!response.ok || !body?.ok) {
        setError(getApiErrorMessage(response, body));
        return;
      }

      setSuccess(true);
    } catch {
      setError('Unable to create account. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <Notice tone="success">
          Account created. Check your email for a verification link.
        </Notice>
        <Link
          className="inline-flex text-sm font-medium text-black underline underline-offset-4"
          href={`/verify-email?email=${encodeURIComponent(email)}`}
        >
          Go to verification page
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <FormField id="email" label="Email" error={null}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </FormField>
      <FormField id="password" label="Password" hint="Minimum 8 characters." error={null}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </FormField>
      <FormField id="confirm" label="Confirm password" error={null}>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </FormField>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
