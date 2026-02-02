export type ApiErrorCode =
  | 'invalid_request'
  | 'email_taken'
  | 'rate_limited'
  | 'token_invalid'
  | 'token_expired'
  | 'not_found'
  | 'unauthorized'
  | 'internal_error';

export type ApiErrorRecovery =
  | 'none'
  | 'retry'
  | 'retry_later'
  | 'reauth'
  | 'update_input'
  | 'resend';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly recovery?: ApiErrorRecovery;

  constructor(code: ApiErrorCode, message: string, status: number, recovery?: ApiErrorRecovery) {
    super(message);
    this.code = code;
    this.status = status;
    this.recovery = recovery;
  }
}

export function asApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError('internal_error', 'Internal server error.', 500);
}

export function getApiErrorRecovery(code: ApiErrorCode, status: number): ApiErrorRecovery {
  if (code === 'rate_limited' || status === 429) return 'retry_later';
  if (code === 'unauthorized' || status === 401) return 'reauth';
  if (code === 'email_taken' || code === 'invalid_request') return 'update_input';
  if (code === 'token_invalid' || code === 'token_expired') return 'resend';
  if (code === 'internal_error' || status >= 500) return 'retry';
  return 'none';
}
