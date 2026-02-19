'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Notice } from '../ui/Notice';

type SupportTicketStatus = 'open' | 'in_progress' | 'resolved';

type AdminSupportTicket = {
  id: string;
  category: 'billing' | 'account' | 'bug' | 'feature_request';
  status: SupportTicketStatus;
  name: string;
  subject: string;
  message: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  inProgressAt: string | null;
  resolvedAt: string | null;
};

type AdminSupportCounts = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
};

type AdminSupportResponse = {
  ok: boolean;
  data: {
    tickets: AdminSupportTicket[];
    counts: AdminSupportCounts;
    nextCursor: string | null;
  };
};

type UpdateSupportResponse = {
  ok: boolean;
  data: {
    ticket: AdminSupportTicket;
  };
};

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const STATUS_OPTIONS: Array<{ value: SupportTicketStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];

function formatTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }
  return parsed.toLocaleString('en-US');
}

function formatCategory(value: AdminSupportTicket['category']): string {
  if (value === 'feature_request') return 'Feature request';
  return value[0]?.toUpperCase() + value.slice(1);
}

function statusLabel(value: SupportTicketStatus): string {
  if (value === 'in_progress') return 'In progress';
  if (value === 'resolved') return 'Resolved';
  return 'Open';
}

export function AdminSupportPanel() {
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [counts, setCounts] = useState<AdminSupportCounts>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | 'all'>('all');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

  const loadTickets = useCallback(
    async (options: {
      status: SupportTicketStatus | 'all';
      cursor?: string | null;
      append?: boolean;
    }) => {
      const { status, cursor, append } = options;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setState('loading');
        setError(null);
      }

      try {
        const params = new URLSearchParams();
        if (status !== 'all') {
          params.set('status', status);
        }
        if (cursor) {
          params.set('cursor', cursor);
        }

        const response = await fetch(`/api/admin/support?${params.toString()}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Unable to load support tickets.');
        }

        const body = (await response.json()) as AdminSupportResponse;
        if (!body.ok) {
          throw new Error('Unable to load support tickets.');
        }

        setCounts(body.data.counts);
        setNextCursor(body.data.nextCursor);
        setTickets((previous) =>
          append ? [...previous, ...body.data.tickets] : body.data.tickets,
        );
        setState('ready');
        setError(null);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : 'Unable to load support tickets.';
        if (!append) {
          setState('error');
        }
        setError(message);
      } finally {
        if (append) {
          setIsLoadingMore(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadTickets({ status: statusFilter });
  }, [loadTickets, statusFilter]);

  const handleUpdateStatus = async (ticketId: string, nextStatus: SupportTicketStatus) => {
    setUpdatingTicketId(ticketId);
    try {
      const response = await fetch(`/api/admin/support/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        throw new Error('Unable to update ticket status.');
      }

      const body = (await response.json()) as UpdateSupportResponse;
      if (!body.ok) {
        throw new Error('Unable to update ticket status.');
      }

      setTickets((previous) =>
        previous.map((ticket) => (ticket.id === ticketId ? body.data.ticket : ticket)),
      );
      await loadTickets({ status: statusFilter });
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : 'Unable to update ticket status.';
      setError(message);
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const handleLoadMore = () => {
    if (!nextCursor || isLoadingMore) {
      return;
    }
    void loadTickets({ status: statusFilter, cursor: nextCursor, append: true });
  };

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Support tickets</p>
          <p className="text-xs text-black/50 dark:text-white/50">
            {counts.total} total / {counts.open} open / {counts.inProgress} in progress /{' '}
            {counts.resolved} resolved
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={statusFilter === option.value ? 'primary' : 'outline'}
              onClick={() => setStatusFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {state === 'loading' ? <Notice>Loading support tickets...</Notice> : null}
      {state === 'error' && error ? <Notice tone="error">{error}</Notice> : null}

      {state === 'ready' && tickets.length === 0 ? (
        <Notice>No support tickets found for this filter.</Notice>
      ) : null}

      {tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-2xl border border-black/10 p-4 dark:border-white/10"
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{ticket.subject}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-black/45 dark:text-white/45">
                    {formatCategory(ticket.category)} | {statusLabel(ticket.status)}
                  </p>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    {ticket.name} | {ticket.email} | Created {formatTimestamp(ticket.createdAt)}
                  </p>
                  <p className="text-xs text-black/50 dark:text-white/50">
                    Updated {formatTimestamp(ticket.updatedAt)}
                  </p>
                  <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-black/10 bg-black/[0.02] px-3 py-2 text-xs leading-relaxed text-black/75 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/75">
                    <p className="whitespace-pre-wrap break-words">{ticket.message}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={ticket.status === 'open' ? 'primary' : 'outline'}
                    disabled={updatingTicketId === ticket.id}
                    onClick={() => void handleUpdateStatus(ticket.id, 'open')}
                  >
                    Open
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={ticket.status === 'in_progress' ? 'primary' : 'outline'}
                    disabled={updatingTicketId === ticket.id}
                    onClick={() => void handleUpdateStatus(ticket.id, 'in_progress')}
                  >
                    In progress
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={ticket.status === 'resolved' ? 'primary' : 'outline'}
                    disabled={updatingTicketId === ticket.id}
                    onClick={() => void handleUpdateStatus(ticket.id, 'resolved')}
                  >
                    Resolved
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {nextCursor ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoadingMore}
            onClick={handleLoadMore}
          >
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
