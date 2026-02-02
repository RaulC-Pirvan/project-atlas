import type { ApiErrorRecovery } from './errors';

export type ApiErrorPayload = {
  code: string;
  message: string;
  recovery?: ApiErrorRecovery;
};

export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: ApiErrorPayload };

export async function parseJson<T>(response: Response): Promise<ApiResponse<T> | null> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return null;
  }
}

type ApiErrorDetails = {
  message: string;
  recovery: ApiErrorRecovery;
};

const recoveryHints: Record<ApiErrorRecovery, string> = {
  none: '',
  retry: 'Try again.',
  retry_later: 'Try again shortly.',
  reauth: 'Please sign in again.',
  update_input: 'Check the details and try again.',
  resend: 'Request a new link.',
};

function fallbackMessageForStatus(status: number): string {
  if (status === 401) return 'Session expired.';
  if (status === 403) return 'Access denied.';
  if (status === 404) return 'Not found.';
  if (status === 409) return 'Conflict.';
  if (status === 422) return 'Invalid input.';
  if (status === 429) return 'Too many requests.';
  if (status >= 500) return 'Something went wrong.';
  return 'Request failed.';
}

function inferRecovery(code?: string, status?: number): ApiErrorRecovery {
  if (code === 'rate_limited' || status === 429) return 'retry_later';
  if (code === 'unauthorized' || status === 401) return 'reauth';
  if (code === 'email_taken' || code === 'invalid_request') return 'update_input';
  if (code === 'token_invalid' || code === 'token_expired') return 'resend';
  if (code === 'internal_error' || (status !== undefined && status >= 500)) return 'retry';
  return 'none';
}

function recoveryHintForCode(code: string | undefined, recovery: ApiErrorRecovery): string {
  if (code === 'email_taken') return 'Try a different email.';
  if (code === 'token_invalid' || code === 'token_expired') return 'Request a new link.';
  return recoveryHints[recovery] ?? '';
}

function appendHint(baseMessage: string, hint: string): string {
  if (!hint) return baseMessage;
  const normalizedBase = baseMessage.toLowerCase();
  const normalizedHint = hint.toLowerCase();
  if (normalizedBase.includes(normalizedHint)) return baseMessage;
  if (
    normalizedHint.includes('try again') &&
    (normalizedBase.includes('try again') || normalizedBase.includes('try later'))
  ) {
    return baseMessage;
  }
  if (normalizedHint.includes('sign in') && normalizedBase.includes('sign in')) {
    return baseMessage;
  }
  if (
    normalizedHint.includes('request a new link') &&
    (normalizedBase.includes('request a new link') || normalizedBase.includes('resend'))
  ) {
    return baseMessage;
  }
  if (
    normalizedHint.includes('different email') &&
    (normalizedBase.includes('different email') || normalizedBase.includes('email already'))
  ) {
    return baseMessage;
  }
  return `${baseMessage} ${hint}`;
}

export function getApiErrorDetails(
  response: Response,
  body: ApiResponse<unknown> | null,
): ApiErrorDetails {
  const errorPayload = body && !body.ok ? body.error : null;
  const baseMessage = errorPayload?.message ?? fallbackMessageForStatus(response.status);
  const recovery = errorPayload?.recovery ?? inferRecovery(errorPayload?.code, response.status);
  const hint = recoveryHintForCode(errorPayload?.code, recovery);

  return {
    message: appendHint(baseMessage, hint),
    recovery,
  };
}

export function getApiErrorMessage(response: Response, body: ApiResponse<unknown> | null): string {
  return getApiErrorDetails(response, body).message;
}
