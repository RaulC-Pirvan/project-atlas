export type LogLevel = 'info' | 'warn' | 'error';

export type LogContext = Record<string, unknown>;

const baseContext = {
  service: 'project-atlas',
  environment: process.env.NODE_ENV ?? 'development',
};

function sanitizeContext(context?: LogContext) {
  if (!context) return {};

  const sanitized: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (value === undefined) continue;
    sanitized[key] = value;
  }

  return sanitized;
}

function toSerializableErrorValue(error: unknown) {
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function serializeError(error: unknown): LogContext {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
    };
  }

  if (typeof error === 'string') {
    return { errorMessage: error };
  }

  return { errorValue: toSerializableErrorValue(error) };
}

function writeLog(level: LogLevel, message: string, context?: LogContext) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...baseContext,
    ...sanitizeContext(context),
  };

  const line = JSON.stringify(payload);

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function logInfo(message: string, context?: LogContext) {
  writeLog('info', message, context);
}

export function logWarn(message: string, context?: LogContext) {
  writeLog('warn', message, context);
}

export function logError(message: string, context?: LogContext) {
  writeLog('error', message, context);
}
