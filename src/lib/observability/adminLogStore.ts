const MAX_LOG_ENTRIES = 200;

export type AdminLogLevel = 'info' | 'warn' | 'error';

export type AdminLogEntry = {
  id: string;
  timestamp: string;
  level: AdminLogLevel;
  message: string;
  requestId?: string;
  method?: string;
  path?: string;
  route?: string;
  status?: number;
  durationMs?: number;
  errorCode?: string;
};

const logEntries: AdminLogEntry[] = [];

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function coerceLevel(value: unknown): AdminLogLevel {
  if (value === 'warn' || value === 'error' || value === 'info') return value;
  return 'info';
}

function coerceString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function coerceNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function recordAdminLog(payload: Record<string, unknown>) {
  const timestamp =
    typeof payload.timestamp === 'string' && payload.timestamp.length > 0
      ? payload.timestamp
      : new Date().toISOString();

  const entry: AdminLogEntry = {
    id: createId(),
    timestamp,
    level: coerceLevel(payload.level),
    message: typeof payload.message === 'string' ? payload.message : 'log',
    requestId: coerceString(payload.requestId),
    method: coerceString(payload.method),
    path: coerceString(payload.path),
    route: coerceString(payload.route),
    status: coerceNumber(payload.status),
    durationMs: coerceNumber(payload.durationMs),
    errorCode: coerceString(payload.errorCode),
  };

  logEntries.unshift(entry);
  if (logEntries.length > MAX_LOG_ENTRIES) {
    logEntries.length = MAX_LOG_ENTRIES;
  }
}

export function getAdminLogSnapshot(limit = 50): AdminLogEntry[] {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), MAX_LOG_ENTRIES);
  return logEntries.slice(0, safeLimit);
}
