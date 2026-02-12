'use client';

import { getApiErrorMessage, parseJson } from '../api/client';
import { getOfflineCompletionQueue, type OfflineCompletionAction } from './offlineQueue';

type CompletionResponse = {
  result: {
    status: 'created' | 'deleted' | 'noop';
    habitId: string;
    date: string;
  };
};

type SyncDropEvent = {
  item: OfflineCompletionAction;
  message: string;
};

type SyncListener = {
  onDrop?: (event: SyncDropEvent) => void;
};

const RETRY_BASE_MS = 1000;
const RETRY_MAX_MS = 30000;

const listeners = new Map<number, SyncListener>();
let listenerId = 0;
let started = false;
let syncInFlight = false;
let retryAttempt = 0;
let retryTimer: number | null = null;

function isOnline(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.onLine;
}

function clearRetryTimer() {
  if (retryTimer === null) return;
  window.clearTimeout(retryTimer);
  retryTimer = null;
}

function computeRetryDelay(attempt: number): number {
  const base = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** attempt);
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}

function scheduleRetry() {
  if (retryTimer !== null) return;
  retryAttempt += 1;
  const delay = computeRetryDelay(retryAttempt);
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    void attemptSync();
  }, delay);
}

function notifyDrop(event: SyncDropEvent) {
  const primary = listeners.values().next().value as SyncListener | undefined;
  if (primary?.onDrop) {
    primary.onDrop(event);
  }
}

async function syncItem(
  item: OfflineCompletionAction,
): Promise<{ outcome: 'success' | 'drop' | 'retry'; message?: string }> {
  try {
    const response = await fetch('/api/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        habitId: item.habitId,
        date: item.dateKey,
        completed: item.completed,
      }),
    });

    const body = await parseJson<CompletionResponse>(response);

    if (response.ok && body?.ok) {
      return { outcome: 'success' };
    }

    const errorCode = body && !body.ok ? body.error.code : undefined;
    if (errorCode === 'not_found' || errorCode === 'invalid_request') {
      return {
        outcome: 'drop',
        message: `${getApiErrorMessage(response, body)} Pending completion removed.`,
      };
    }

    if (response.status === 404 || response.status === 400) {
      return {
        outcome: 'drop',
        message: `${getApiErrorMessage(response, body)} Pending completion removed.`,
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        outcome: 'retry',
      };
    }

    if (response.status >= 500 || response.status === 429) {
      return { outcome: 'retry' };
    }

    return { outcome: 'retry' };
  } catch {
    return { outcome: 'retry' };
  }
}

async function attemptSync(): Promise<void> {
  if (syncInFlight) return;
  if (!isOnline()) return;
  clearRetryTimer();

  syncInFlight = true;
  const queue = getOfflineCompletionQueue();
  await queue.hydrate();
  let shouldRetry = false;

  const snapshot = queue.getSnapshot();
  if (snapshot.items.length === 0) {
    syncInFlight = false;
    retryAttempt = 0;
    return;
  }

  for (const item of snapshot.items) {
    if (!isOnline()) {
      break;
    }
    const result = await syncItem(item);
    if (result.outcome === 'success') {
      await queue.remove(item.key);
      continue;
    }
    if (result.outcome === 'drop') {
      await queue.remove(item.key);
      if (result.message) {
        notifyDrop({ item, message: result.message });
      }
      continue;
    }
    shouldRetry = true;
    break;
  }

  syncInFlight = false;
  const remaining = queue.getSnapshot().items.length;
  if (remaining === 0) {
    retryAttempt = 0;
    return;
  }

  if (shouldRetry) {
    scheduleRetry();
  }
}

function handleOnline() {
  void attemptSync();
}

async function startSyncOnStartup() {
  const queue = getOfflineCompletionQueue();
  await queue.hydrate();
  if (queue.getSnapshot().items.length > 0 && isOnline()) {
    void attemptSync();
  }
}

function ensureStarted() {
  if (started) return;
  started = true;
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
  }
  void startSyncOnStartup();
}

export function registerOfflineCompletionSync(listener: SyncListener): () => void {
  ensureStarted();
  const id = listenerId + 1;
  listenerId = id;
  listeners.set(id, listener);

  return () => {
    listeners.delete(id);
  };
}

export function requestOfflineCompletionSync() {
  ensureStarted();
  void attemptSync();
}
