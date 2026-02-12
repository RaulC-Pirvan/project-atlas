import { addUtcDays, normalizeToUtcDate, parseUtcDateKey } from './dates';

export type OfflineCompletionAction = {
  key: string;
  habitId: string;
  dateKey: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
};

export type OfflineQueueValidation =
  | { ok: true }
  | {
      ok: false;
      reason: 'invalid_date' | 'future' | 'grace_expired' | 'history_blocked';
    };

export type OfflineQueuePolicy = {
  timeZone: string;
  now?: Date;
  graceHour?: number;
  allowHistory?: boolean;
};

export type OfflineQueueSnapshot = {
  items: OfflineCompletionAction[];
  pendingByDate: Map<string, Set<string>>;
  pendingKeys: Set<string>;
};

export type OfflineQueueListener = (snapshot: OfflineQueueSnapshot) => void;

const DEFAULT_GRACE_HOUR = 2;
const DEFAULT_ALLOW_HISTORY = false;
const DB_NAME = 'atlas-offline';
const STORE_NAME = 'completionQueue';
const DB_VERSION = 1;

function getIndexedDb(): IDBFactory | null {
  if (typeof globalThis === 'undefined') return null;
  return 'indexedDB' in globalThis ? globalThis.indexedDB : null;
}

function openDatabase(): Promise<IDBDatabase> {
  const idb = getIndexedDb();
  if (!idb) {
    return Promise.reject(new Error('IndexedDB is unavailable.'));
  }

  return new Promise((resolve, reject) => {
    const request = idb.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB.'));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
  });
}

async function readAllFromStore(): Promise<OfflineCompletionAction[]> {
  const idb = getIndexedDb();
  if (!idb) return [];

  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const items = await requestToPromise(store.getAll());
  await transactionDone(transaction);
  db.close();
  return items ?? [];
}

async function upsertInStore(item: OfflineCompletionAction): Promise<void> {
  const idb = getIndexedDb();
  if (!idb) return;

  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  store.put(item);
  await transactionDone(transaction);
  db.close();
}

async function deleteFromStore(key: string): Promise<void> {
  const idb = getIndexedDb();
  if (!idb) return;

  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  store.delete(key);
  await transactionDone(transaction);
  db.close();
}

async function clearStore(): Promise<void> {
  const idb = getIndexedDb();
  if (!idb) return;

  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  store.clear();
  await transactionDone(transaction);
  db.close();
}

function getLocalHour(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hourPart = parts.find((part) => part.type === 'hour')?.value;
  if (!hourPart) {
    throw new Error('Unable to resolve local hour.');
  }
  const parsed = Number(hourPart);
  if (!Number.isFinite(parsed)) {
    throw new Error('Invalid local hour value.');
  }
  return parsed === 24 ? 0 : parsed;
}

export function createQueueKey(habitId: string, dateKey: string): string {
  return `${habitId}:${dateKey}`;
}

export function normalizeQueueItems(
  items: OfflineCompletionAction[],
): OfflineCompletionAction[] {
  const byKey = new Map<string, OfflineCompletionAction>();

  for (const item of items) {
    const existing = byKey.get(item.key);
    if (!existing || item.updatedAt >= existing.updatedAt) {
      byKey.set(item.key, item);
    }
  }

  return [...byKey.values()].sort((a, b) => a.updatedAt - b.updatedAt);
}

export function upsertQueueItem(
  items: OfflineCompletionAction[],
  nextItem: OfflineCompletionAction,
): OfflineCompletionAction[] {
  const updated = items.filter((item) => item.key !== nextItem.key);
  updated.push(nextItem);
  return normalizeQueueItems(updated);
}

export function buildQueueItem(input: {
  habitId: string;
  dateKey: string;
  completed: boolean;
  now?: Date;
  previous?: OfflineCompletionAction | null;
}): OfflineCompletionAction {
  const timestamp = (input.now ?? new Date()).getTime();
  const key = createQueueKey(input.habitId, input.dateKey);

  return {
    key,
    habitId: input.habitId,
    dateKey: input.dateKey,
    completed: input.completed,
    createdAt: input.previous?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

export function buildPendingIndex(
  items: OfflineCompletionAction[],
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const item of items) {
    const set = map.get(item.dateKey) ?? new Set<string>();
    set.add(item.habitId);
    map.set(item.dateKey, set);
  }
  return map;
}

export function validateCompletionDate(
  dateKey: string,
  policy: OfflineQueuePolicy,
): OfflineQueueValidation {
  const target = parseUtcDateKey(dateKey);
  if (!target) return { ok: false, reason: 'invalid_date' };

  const now = policy.now ?? new Date();
  const timeZone = policy.timeZone;
  const graceHour = policy.graceHour ?? DEFAULT_GRACE_HOUR;
  const allowHistory = policy.allowHistory ?? DEFAULT_ALLOW_HISTORY;

  const today = normalizeToUtcDate(now, timeZone);
  if (target.getTime() > today.getTime()) {
    return { ok: false, reason: 'future' };
  }

  const yesterday = addUtcDays(today, -1);
  const isYesterday = target.getTime() === yesterday.getTime();

  if (!allowHistory) {
    const isToday = target.getTime() === today.getTime();
    const hour = getLocalHour(now, timeZone);
    const withinGrace = hour < graceHour;
    if (isToday) return { ok: true };
    if (isYesterday && withinGrace) return { ok: true };
    if (isYesterday && !withinGrace) return { ok: false, reason: 'grace_expired' };
    return { ok: false, reason: 'history_blocked' };
  }

  if (isYesterday) {
    const hour = getLocalHour(now, timeZone);
    if (hour >= graceHour) {
      return { ok: true };
    }
  }

  return { ok: true };
}

export class OfflineCompletionQueue {
  private items: OfflineCompletionAction[] = [];
  private listeners = new Set<OfflineQueueListener>();
  private hydrated = false;

  getSnapshot(): OfflineQueueSnapshot {
    const pendingByDate = buildPendingIndex(this.items);
    const pendingKeys = new Set(this.items.map((item) => item.key));
    return {
      items: [...this.items],
      pendingByDate,
      pendingKeys,
    };
  }

  subscribe(listener: OfflineQueueListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  async hydrate(): Promise<void> {
    if (this.hydrated) return;
    try {
      const stored = await readAllFromStore();
      this.items = normalizeQueueItems(stored);
      this.hydrated = true;
      this.emit();
    } catch {
      this.items = [];
      this.hydrated = true;
      this.emit();
    }
  }

  async enqueue(
    input: { habitId: string; dateKey: string; completed: boolean },
    policy: OfflineQueuePolicy,
  ): Promise<{ ok: true; item: OfflineCompletionAction } | OfflineQueueValidation> {
    await this.hydrate();
    const validation = validateCompletionDate(input.dateKey, policy);
    if (!validation.ok) return validation;

    const previous = this.items.find(
      (item) => item.habitId === input.habitId && item.dateKey === input.dateKey,
    );
    const nextItem = buildQueueItem({
      habitId: input.habitId,
      dateKey: input.dateKey,
      completed: input.completed,
      now: policy.now,
      previous,
    });

    this.items = upsertQueueItem(this.items, nextItem);
    await upsertInStore(nextItem);
    this.emit();
    return { ok: true, item: nextItem };
  }

  async remove(key: string): Promise<void> {
    this.items = this.items.filter((item) => item.key !== key);
    await deleteFromStore(key);
    this.emit();
  }

  async replaceAll(items: OfflineCompletionAction[]): Promise<void> {
    this.items = normalizeQueueItems(items);
    await clearStore();
    for (const item of this.items) {
      await upsertInStore(item);
    }
    this.emit();
  }
}

let queueSingleton: OfflineCompletionQueue | null = null;

export function getOfflineCompletionQueue(): OfflineCompletionQueue {
  if (!queueSingleton) {
    queueSingleton = new OfflineCompletionQueue();
  }
  return queueSingleton;
}
