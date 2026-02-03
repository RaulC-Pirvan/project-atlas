'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Notice } from '../ui/Notice';

type AdminUserSummary = {
  email: string;
  displayName: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  deletedAt: string | null;
};

type AdminUserCounts = {
  total: number;
  verified: number;
  unverified: number;
};

type AdminUserResponse = {
  ok: boolean;
  data: {
    users: AdminUserSummary[];
    counts: AdminUserCounts;
    nextCursor: string | null;
  };
};

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

function formatDate(value: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-US');
}

export function AdminUsersPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [counts, setCounts] = useState<AdminUserCounts>({ total: 0, verified: 0, unverified: 0 });
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadUsers = useCallback(
    async (options: { search: string; cursor?: string | null; append?: boolean }) => {
      const { search, cursor, append } = options;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setState('loading');
        setError(null);
      }

      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (cursor) params.set('cursor', cursor);
        const response = await fetch(`/api/admin/users?${params.toString()}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Unable to load users.');
        }

        const body = (await response.json()) as AdminUserResponse;
        if (!body.ok) {
          throw new Error('Unable to load users.');
        }

        setCounts(body.data.counts);
        setNextCursor(body.data.nextCursor);
        setUsers((prev) => (append ? [...prev, ...body.data.users] : body.data.users));
        setState('ready');
        setError(null);
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : 'Unable to load users.';
        if (!append) {
          setState('error');
        }
        setError(message);
      } finally {
        if (append) setIsLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadUsers({ search: '', append: false });
  }, [loadUsers]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = searchTerm.trim();
    setAppliedSearch(normalized);
    void loadUsers({ search: normalized, append: false });
  };

  const handleLoadMore = () => {
    if (!nextCursor || isLoadingMore) return;
    void loadUsers({ search: appliedSearch, cursor: nextCursor, append: true });
  };

  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">User directory</p>
          <p className="text-xs text-black/50 dark:text-white/50">
            {counts.total} total / {counts.verified} verified / {counts.unverified} unverified
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full gap-2 sm:w-auto">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search email or name"
            aria-label="Search users"
            className="h-9 w-full sm:w-64"
          />
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>
      </div>

      {state === 'loading' ? <Notice>Loading users...</Notice> : null}
      {state === 'error' ? <Notice tone="error">{error}</Notice> : null}

      {state === 'ready' && users.length === 0 ? (
        <Notice>No users match this search.</Notice>
      ) : null}

      {users.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-[0.2em] text-black/40 dark:border-white/10 dark:text-white/40">
              <tr>
                <th className="py-2 pr-3 font-medium">User</th>
                <th className="py-2 pr-3 font-medium">Email</th>
                <th className="py-2 pr-3 font-medium">Verified</th>
                <th className="py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10">
              {users.map((user) => (
                <tr key={`${user.email}-${user.createdAt}`}>
                  <td className="py-3 pr-3 font-medium">
                    {user.displayName}
                    {user.deletedAt ? (
                      <span className="ml-2 text-xs uppercase tracking-[0.2em] text-black/40 dark:text-white/40">
                        Deleted
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3 text-black/70 dark:text-white/70">{user.email}</td>
                  <td className="py-3 pr-3">
                    {user.emailVerifiedAt ? (
                      <span className="text-xs uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs uppercase tracking-[0.2em] text-black/30 dark:text-white/30">
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-black/60 dark:text-white/60">
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {nextCursor ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
