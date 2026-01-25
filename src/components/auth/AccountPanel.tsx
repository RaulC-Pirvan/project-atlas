'use client';

import { useState } from 'react';

import { getApiErrorMessage, parseJson } from '../../lib/api/client';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Notice } from '../ui/Notice';
import { AvatarPlaceholder } from './AvatarPlaceholder';

type AccountPanelProps = {
  email: string;
  emailVerifiedAt?: string | null;
};

type AccountResponse = {
  ok: boolean;
};

export function AccountPanel({ email, emailVerifiedAt }: AccountPanelProps) {
  const [nextEmail, setNextEmail] = useState(email);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUpdateError(null);
    setUpdateMessage(null);

    if (!nextEmail && !password) {
      setUpdateError('Provide a new email or password.');
      return;
    }

    if (password && password !== confirm) {
      setUpdateError('Passwords do not match.');
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: nextEmail || undefined, password: password || undefined }),
      });
      const body = await parseJson<AccountResponse>(response);

      if (!response.ok || !body?.ok) {
        if (response.status === 404) {
          setUpdateError('Account updates are not available yet.');
          return;
        }
        setUpdateError(getApiErrorMessage(response, body));
        return;
      }

      setUpdateMessage('Account updated.');
    } catch {
      setUpdateError('Account update is not available yet.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeleteError(null);
    setDeleteMessage(null);

    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Type DELETE to confirm.');
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
          setDeleteError('Delete requests are not available yet.');
          return;
        }
        setDeleteError(getApiErrorMessage(response, body));
        return;
      }

      setDeleteMessage('Delete request submitted.');
    } catch {
      setDeleteError('Delete request is not available yet.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <AvatarPlaceholder />
        <div>
          <p className="text-sm font-semibold">{email}</p>
          <p className="text-xs text-black/50">{emailVerifiedAt ? 'Verified' : 'Unverified'}</p>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleUpdate}>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">Update account</p>
          <p className="text-sm text-black/60">Change email or password.</p>
        </div>
        <FormField id="account-email" label="Email" error={null}>
          <Input
            id="account-email"
            name="email"
            type="email"
            autoComplete="email"
            value={nextEmail}
            onChange={(event) => setNextEmail(event.target.value)}
          />
        </FormField>
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
        {updateError ? <Notice tone="error">{updateError}</Notice> : null}
        {updateMessage ? <Notice tone="success">{updateMessage}</Notice> : null}
        <Button type="submit" variant="outline" className="w-full" disabled={updating}>
          {updating ? 'Updating...' : 'Update account'}
        </Button>
      </form>

      <form className="space-y-6" onSubmit={handleDelete}>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">Delete request</p>
          <p className="text-sm text-black/60">Type DELETE to request account removal.</p>
        </div>
        <FormField id="delete-confirm" label="Confirm" error={null}>
          <Input
            id="delete-confirm"
            name="confirm"
            type="text"
            value={deleteConfirm}
            onChange={(event) => setDeleteConfirm(event.target.value)}
          />
        </FormField>
        {deleteError ? <Notice tone="error">{deleteError}</Notice> : null}
        {deleteMessage ? <Notice tone="success">{deleteMessage}</Notice> : null}
        <Button type="submit" variant="ghost" className="w-full" disabled={deleting}>
          {deleting ? 'Submitting...' : 'Request delete'}
        </Button>
      </form>
    </div>
  );
}
