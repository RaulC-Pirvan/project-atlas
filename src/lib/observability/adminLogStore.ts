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
  metadata?: Record<string, string | number | boolean | null>;
};

const logEntries: AdminLogEntry[] = [];
const MAX_METADATA_STRING_LENGTH = 160;
const ANALYTICS_METADATA_KEYS = new Set([
  'schemaVersion',
  'event',
  'surface',
  'authenticated',
  'userId',
  'source',
  'target',
  'provider',
  'reason',
  'details',
  'checkoutStatus',
  'checkoutSessionId',
  'isPro',
  'dedupeReason',
]);

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

function coerceMetadataValue(value: unknown): string | number | boolean | null | undefined {
  if (value === null) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (normalized.length === 0) return undefined;
    if (normalized.length > MAX_METADATA_STRING_LENGTH) {
      return normalized.slice(0, MAX_METADATA_STRING_LENGTH);
    }
    return normalized;
  }
  return undefined;
}

function extractAnalyticsMetadata(payload: Record<string, unknown>) {
  const metadata: Record<string, string | number | boolean | null> = {};
  for (const key of ANALYTICS_METADATA_KEYS) {
    const coerced = coerceMetadataValue(payload[key]);
    if (coerced !== undefined) {
      metadata[key] = coerced;
    }
  }

  if (Object.keys(metadata).length === 0) {
    return undefined;
  }

  return metadata;
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
    metadata: extractAnalyticsMetadata(payload),
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
