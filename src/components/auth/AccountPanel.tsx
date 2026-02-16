'use client';

import { useRef, useState } from 'react';

import { getApiErrorMessage, parseJson } from '../../lib/api/client';
import type { WeekStart } from '../habits/weekdays';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Notice } from '../ui/Notice';
import { type ToastItem, ToastStack } from '../ui/Toast';
import { SignOutButton } from './SignOutButton';

type AccountPanelProps = {
  email: string;
  displayName: string;
  weekStart: WeekStart;
  keepCompletedAtBottom: boolean;
  hasPassword: boolean;
};

type AccountResponse = {
  ok: boolean;
};

export function AccountPanel({
  email,
  displayName,
  weekStart,
  keepCompletedAtBottom,
  hasPassword,
}: AccountPanelProps) {
  const [nextEmail, setNextEmail] = useState(email);
  const [displayNameInput, setDisplayNameInput] = useState(displayName);
  const [weekStartInput, setWeekStartInput] = useState<WeekStart>(weekStart);
  const [keepCompletedAtBottomInput, setKeepCompletedAtBottomInput] =
    useState(keepCompletedAtBottom);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [updatingName, setUpdatingName] = useState(false);
  const [updatingWeekStart, setUpdatingWeekStart] = useState(false);
  const [updatingOrdering, setUpdatingOrdering] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmError, setDeleteConfirmError] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState(false);
  const [hasPasswordSet, setHasPasswordSet] = useState(hasPassword);
  const [baselineDisplayName, setBaselineDisplayName] = useState(displayName);
  const [baselineWeekStart, setBaselineWeekStart] = useState<WeekStart>(weekStart);
  const [baselineKeepCompletedAtBottom, setBaselineKeepCompletedAtBottom] =
    useState(keepCompletedAtBottom);

  const deleteConfirmInvalid = deleteConfirmError;
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
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4800);

    window.setTimeout(() => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, state: 'closing' } : toast)),
      );
    }, 4500);
  };

  const handleDisplayNameUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedDisplayName = displayNameInput.trim();
    if (normalizedDisplayName.length < 2) {
      pushToast('Display name is required.', 'error');
      return;
    }

    if (normalizedDisplayName === baselineDisplayName.trim()) {
      pushToast('No changes to update.', 'neutral');
      return;
    }

    setUpdatingName(true);

    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: normalizedDisplayName,
        }),
      });
      const body = await parseJson<AccountResponse>(response);

      if (!response.ok || !body?.ok) {
        if (response.status === 404) {
          pushToast('Display name updates are not available yet.', 'error');
          return;
        }
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      setBaselineDisplayName(normalizedDisplayName);
      setDisplayNameInput(normalizedDisplayName);
      pushToast('Display name updated.', 'success');
    } catch {
      pushToast('Display name update is not available yet.', 'error');
    } finally {
      setUpdatingName(false);
    }
  };

  const handleEmailUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentPasswordError(false);

    const normalizedEmail = nextEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      pushToast('Email is required.', 'error');
      return;
    }

    if (normalizedEmail === email.toLowerCase()) {
      pushToast('No changes to update.', 'neutral');
      return;
    }

    if (!hasPasswordSet) {
      pushToast('Set a password first, then update your email.', 'error');
      return;
    }

    if (!currentPassword) {
      setCurrentPasswordError(true);
      pushToast('Confirm your password to change email.', 'error');
      return;
    }

    setUpdatingEmail(true);

    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          currentPassword,
        }),
      });
      const body = await parseJson<AccountResponse>(response);

      if (!response.ok || !body?.ok) {
        if (response.status === 404) {
          pushToast('Email updates are not available yet.', 'error');
          return;
        }
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      setCurrentPassword('');
      setNextEmail(normalizedEmail);
      setPendingEmail(normalizedEmail);
      setShowEmailChangeModal(true);
    } catch {
      pushToast('Email update is not available yet.', 'error');
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleWeekStartUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (weekStartInput === baselineWeekStart) {
      pushToast('No changes to update.', 'neutral');
      return;
    }

    setUpdatingWeekStart(true);

    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart: weekStartInput,
        }),
      });
      const body = await parseJson<AccountResponse>(response);

      if (!response.ok || !body?.ok) {
        if (response.status === 404) {
          pushToast('Week start updates are not available yet.', 'error');
          return;
        }
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      setBaselineWeekStart(weekStartInput);
      pushToast('Week start updated.', 'success');
    } catch {
      pushToast('Week start update is not available yet.', 'error');
    } finally {
      setUpdatingWeekStart(false);
    }
  };

  const handleOrderingUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (keepCompletedAtBottomInput === baselineKeepCompletedAtBottom) {
      pushToast('No changes to update.', 'neutral');
      return;
    }

    setUpdatingOrdering(true);

    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keepCompletedAtBottom: keepCompletedAtBottomInput,
        }),
      });
      const body = await parseJson<AccountResponse>(response);

      if (!response.ok || !body?.ok) {
        if (response.status === 404) {
          pushToast('Ordering updates are not available yet.', 'error');
          return;
        }
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      setBaselineKeepCompletedAtBottom(keepCompletedAtBottomInput);
      pushToast('Ordering preference updated.', 'success');
    } catch {
      pushToast('Ordering update is not available yet.', 'error');
    } finally {
      setUpdatingOrdering(false);
    }
  };

  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password) {
      pushToast('Enter a new password.', 'neutral');
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

    setUpdatingPassword(true);

    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
        }),
      });
      const body = await parseJson<AccountResponse>(response);

      if (!response.ok || !body?.ok) {
        if (response.status === 404) {
          pushToast('Password updates are not available yet.', 'error');
          return;
        }
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      setPassword('');
      setConfirm('');
      setHasPasswordSet(true);
      pushToast('Password updated.', 'success');
    } catch {
      pushToast('Password update is not available yet.', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleEmailChangeAcknowledge = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/sign-in';
    }
  };

  const handleDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeleteConfirmError(false);

    if (deleteConfirm.trim().toUpperCase() !== 'DELETE') {
      setDeleteConfirmError(true);
      pushToast('Type DELETE to confirm.', 'error');
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch('/api/account/delete-request', {
        method: 'POST',
      });
      const body = await parseJson<AccountResponse>(response);

      if (!response.ok || !body?.ok) {
        if (response.status === 404) {
          pushToast('Delete requests are not available yet.', 'error');
          return;
        }
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      setShowDeleteModal(true);
    } catch {
      pushToast('Delete request is not available yet.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAcknowledge = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/sign-up';
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm font-semibold">{baselineDisplayName}</p>
            <p className="text-xs text-black/50 dark:text-white/50">{email}</p>
          </div>
        </div>
        <SignOutButton />
      </div>

      <form className="space-y-6" onSubmit={handleDisplayNameUpdate}>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
            Display name
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">Update how your name appears.</p>
        </div>
        <FormField id="account-display-name" label="Display name" error={null}>
          <Input
            id="account-display-name"
            name="displayName"
            type="text"
            autoComplete="name"
            value={displayNameInput}
            onChange={(event) => setDisplayNameInput(event.target.value)}
          />
        </FormField>
        <Button type="submit" variant="outline" className="w-full" disabled={updatingName}>
          {updatingName ? 'Updating...' : 'Update display name'}
        </Button>
      </form>

      <form
        className="space-y-6 border-t border-black/10 pt-6 dark:border-white/10"
        onSubmit={handleWeekStartUpdate}
      >
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
            Week start
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            Choose how the calendar week begins.
          </p>
        </div>
        <FormField id="account-week-start" label="Week starts on" error={null}>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={weekStartInput === 'mon' ? 'primary' : 'outline'}
              onClick={() => setWeekStartInput('mon')}
            >
              Monday
            </Button>
            <Button
              type="button"
              size="sm"
              variant={weekStartInput === 'sun' ? 'primary' : 'outline'}
              onClick={() => setWeekStartInput('sun')}
            >
              Sunday
            </Button>
          </div>
        </FormField>
        <Button type="submit" variant="outline" className="w-full" disabled={updatingWeekStart}>
          {updatingWeekStart ? 'Updating...' : 'Update week start'}
        </Button>
      </form>

      <form
        className="space-y-6 border-t border-black/10 pt-6 dark:border-white/10"
        onSubmit={handleOrderingUpdate}
      >
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
            Daily ordering
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            Decide whether completed habits stay below unfinished ones.
          </p>
        </div>
        <FormField id="account-ordering" label="Completion ordering" error={null}>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={keepCompletedAtBottomInput ? 'primary' : 'outline'}
              onClick={() => setKeepCompletedAtBottomInput(true)}
            >
              Keep completed at bottom
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!keepCompletedAtBottomInput ? 'primary' : 'outline'}
              onClick={() => setKeepCompletedAtBottomInput(false)}
            >
              Keep original order
            </Button>
          </div>
        </FormField>
        <Button type="submit" variant="outline" className="w-full" disabled={updatingOrdering}>
          {updatingOrdering ? 'Updating...' : 'Update ordering'}
        </Button>
      </form>

      <form
        className="space-y-6 border-t border-black/10 pt-6 dark:border-white/10"
        onSubmit={handleEmailUpdate}
      >
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
            Email
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            {hasPasswordSet
              ? 'Changing email requires password confirmation.'
              : 'Set a password before changing email.'}
          </p>
        </div>
        <FormField id="account-email" label="Email" error={null}>
          <Input
            id="account-email"
            name="email"
            type="email"
            autoComplete="email"
            value={nextEmail}
            onChange={(event) => {
              const value = event.target.value;
              setNextEmail(value);
              if (value.trim().toLowerCase() === email.toLowerCase()) {
                setCurrentPasswordError(false);
              }
            }}
          />
        </FormField>
        {hasPasswordSet ? (
          <FormField
            id="account-current-password"
            label="Confirm password for email"
            hint="Required to change email."
            error={null}
          >
            <Input
              id="account-current-password"
              name="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              className={
                currentPasswordError ? 'border-rose-400 focus-visible:ring-rose-400/30' : ''
              }
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                if (currentPasswordError) setCurrentPasswordError(false);
              }}
            />
          </FormField>
        ) : (
          <Notice tone="neutral">
            This account currently uses Google sign-in without a local password. Set a password
            below, then return here to change your email.
          </Notice>
        )}
        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={!hasPasswordSet || updatingEmail}
        >
          {hasPasswordSet ? (updatingEmail ? 'Updating...' : 'Update email') : 'Set password first'}
        </Button>
      </form>

      <form
        className="space-y-6 border-t border-black/10 pt-6 dark:border-white/10"
        onSubmit={handlePasswordUpdate}
      >
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
            Password
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">Choose a new password.</p>
        </div>
        <FormField id="account-password" label="New password" error={null}>
          <Input
            id="account-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>
        <FormField id="account-confirm" label="Confirm new password" error={null}>
          <Input
            id="account-confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </FormField>
        <Button type="submit" variant="outline" className="w-full" disabled={updatingPassword}>
          {updatingPassword ? 'Updating...' : 'Update password'}
        </Button>
      </form>

      <form className="space-y-6" onSubmit={handleDelete}>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
            Delete request
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            Type DELETE to request account removal.
          </p>
        </div>
        <FormField id="delete-confirm" label="Confirm" error={null}>
          <Input
            id="delete-confirm"
            name="confirm"
            type="text"
            value={deleteConfirm}
            className={deleteConfirmInvalid ? 'border-red-500 focus-visible:ring-red-500/30' : ''}
            onChange={(event) => {
              setDeleteConfirm(event.target.value);
              if (deleteConfirmError) setDeleteConfirmError(false);
            }}
          />
        </FormField>
        <Button type="submit" variant="danger" className="w-full" disabled={deleting}>
          {deleting ? 'Submitting...' : 'Request delete'}
        </Button>
      </form>

      <Modal
        open={showDeleteModal}
        title="Account deleted"
        footer={
          <Button type="button" size="lg" onClick={handleDeleteAcknowledge}>
            Create a new account
          </Button>
        }
      >
        <p>
          Your account has been permanently deleted. You have been signed out and will need to
          create a new account to continue.
        </p>
      </Modal>

      <Modal
        open={showEmailChangeModal}
        title="Email updated"
        footer={
          <Button type="button" size="lg" onClick={handleEmailChangeAcknowledge}>
            Sign in again
          </Button>
        }
      >
        <p>
          Your email has been changed{pendingEmail ? ` to ${pendingEmail}` : ''}. We sent a new
          verification link. You will be signed out now and must verify the new email before
          accessing your account.
        </p>
      </Modal>

      <ToastStack toasts={toasts} />
    </div>
  );
}
