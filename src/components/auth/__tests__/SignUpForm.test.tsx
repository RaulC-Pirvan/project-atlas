import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SignUpForm } from '../SignUpForm';

const signInMock = vi.fn();

vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

describe('SignUpForm', () => {
  beforeEach(() => {
    signInMock.mockReset();
  });

  it('shows an error when passwords do not match', () => {
    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password321' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('starts Google auth when the OAuth button is used', async () => {
    signInMock.mockResolvedValueOnce(undefined);

    render(<SignUpForm showGoogleSignIn />);

    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('google', { callbackUrl: '/today' });
    });
  });

  it('hides Google button by default and keeps email signup fields visible', () => {
    render(<SignUpForm />);

    expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows Google button and keeps email signup fallback visible when enabled', () => {
    render(<SignUpForm showGoogleSignIn />);

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByText(/or create with email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });
});
